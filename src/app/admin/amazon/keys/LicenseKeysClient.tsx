'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Plus, Trash2, Key, Package, ChevronLeft, ChevronRight, Loader2, X, CheckCircle, AlertCircle, Upload, Calendar } from 'lucide-react';

interface LicenseKey {
    id: string;
    license_key: string;
    fsn: string;
    is_redeemed: boolean;
    order_id: string | null;
    created_at: string;
    redeemed_at: string | null;
}

interface FsnMapping {
    fsn: string;
    product_title: string;
}

type DateFilterType = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function LicenseKeysClient() {
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [fsnMappings, setFsnMappings] = useState<FsnMapping[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFsn, setFilterFsn] = useState<string>('all');
    const [filterRedeemed, setFilterRedeemed] = useState<string>('available');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Date filter states
    const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Add key form
    const [newKeys, setNewKeys] = useState('');
    const [newFsn, setNewFsn] = useState('');
    const [productName, setProductName] = useState('');
    const [addResult, setAddResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
    const [multiplyQuantity, setMultiplyQuantity] = useState<number | ''>('');

    // Suffix characters for generating unique keys (5 keys per character)
    const SUFFIX_CHARS = ['-', '~', "'", '=', '+', '_', '*', '#', '@', '!'];

    // Generate unique keys by appending suffixes
    const generateUniqueKeys = (baseKey: string, quantity: number): string[] => {
        const keys: string[] = [];
        for (let i = 0; i < quantity; i++) {
            const charIndex = Math.floor(i / 5); // Change character every 5 keys
            const repeatCount = (i % 5) + 1; // Repeat 1-5 times
            const suffixChar = SUFFIX_CHARS[charIndex % SUFFIX_CHARS.length];
            const suffix = suffixChar.repeat(repeatCount);
            keys.push(`${baseKey}${suffix}`);
        }
        return keys;
    };

    // Stats
    const [availableCount, setAvailableCount] = useState(0);
    const [redeemedCount, setRedeemedCount] = useState(0);

    const pageSize = 50;
    const supabase = createClient();

    // Fetch unique FSNs for dropdown
    const fetchFsnMappings = useCallback(async () => {
        const { data } = await supabase
            .from('products_data')
            .select('fsn, product_title')
            .order('fsn');

        if (data) {
            setFsnMappings(data);
        }
    }, [supabase]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        const { count: available } = await supabase
            .from('amazon_activation_license_keys')
            .select('*', { count: 'exact', head: true })
            .eq('is_redeemed', false);

        const { count: redeemed } = await supabase
            .from('amazon_activation_license_keys')
            .select('*', { count: 'exact', head: true })
            .eq('is_redeemed', true);

        setAvailableCount(available || 0);
        setRedeemedCount(redeemed || 0);
    }, [supabase]);

    // Fetch keys
    const fetchKeys = useCallback(async () => {
        setIsLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('amazon_activation_license_keys')
            .select('*', { count: 'exact' })
            .order('fsn', { ascending: true })
            .order('created_at', { ascending: false });

        if (searchQuery) {
            query = query.or(`license_key.ilike.%${searchQuery}%,fsn.ilike.%${searchQuery}%`);
        }

        if (filterFsn !== 'all') {
            query = query.eq('fsn', filterFsn);
        }

        if (filterRedeemed === 'available') {
            query = query.eq('is_redeemed', false);
        } else if (filterRedeemed === 'redeemed') {
            query = query.eq('is_redeemed', true);

            // Apply date filter for redeemed keys
            if (dateFilter !== 'all') {
                const now = new Date();
                let startDate: Date | null = null;
                let endDate: Date | null = null;

                if (dateFilter === 'today') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                } else if (dateFilter === 'yesterday') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
                } else if (dateFilter === 'week') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                } else if (dateFilter === 'month') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
                    startDate = new Date(customStartDate);
                    endDate = new Date(customEndDate);
                    endDate.setHours(23, 59, 59, 999);
                }

                if (startDate && endDate) {
                    query = query
                        .gte('redeemed_at', startDate.toISOString())
                        .lte('redeemed_at', endDate.toISOString());
                }
            }
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching keys:', error);
        } else {
            setKeys(data || []);
            setTotalCount(count || 0);
        }
        setIsLoading(false);
    }, [currentPage, searchQuery, filterFsn, filterRedeemed, dateFilter, customStartDate, customEndDate, supabase]);

    useEffect(() => {
        fetchFsnMappings();
        fetchStats();
    }, [fetchFsnMappings, fetchStats]);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    // Auto-refresh stats every 10 seconds to reflect activations
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats();
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(interval);
    }, [fetchStats]);

    // Get product name from FSN
    const handleFsnChange = (fsn: string) => {
        setNewFsn(fsn);
        const mapping = fsnMappings.find(m => m.fsn === fsn);
        setProductName(mapping?.product_title || '');
    };

    // Add new keys (bulk)
    const handleAddKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeys.trim() || !newFsn) return;

        setIsSubmitting(true);
        setAddResult(null);

        // Parse keys from textarea - split by newlines and filter empty lines
        // Also remove leading single quotes (') as supplier sometimes provides keys with them
        let keysToAdd = newKeys
            .split('\n')
            .map(key => key.trim())
            .map(key => key.startsWith("'") ? key.slice(1) : key) // Remove leading quote
            .filter(key => key.length > 0);

        // If quantity multiplier is set, generate unique variants for each base key
        if (multiplyQuantity && multiplyQuantity > 0) {
            const expandedKeys: string[] = [];
            for (const baseKey of keysToAdd) {
                const uniqueKeys = generateUniqueKeys(baseKey, multiplyQuantity);
                expandedKeys.push(...uniqueKeys);
            }
            keysToAdd = expandedKeys;
        }

        if (keysToAdd.length === 0) {
            setIsSubmitting(false);
            return;
        }

        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        // Insert keys in batches to handle large numbers
        const batchSize = 100;
        for (let i = 0; i < keysToAdd.length; i += batchSize) {
            const batch = keysToAdd.slice(i, i + batchSize);
            const insertData = batch.map(key => ({
                license_key: key,
                fsn: newFsn,
                is_redeemed: false,
            }));

            const { data, error } = await supabase
                .from('amazon_activation_license_keys')
                .insert(insertData)
                .select();

            if (error) {
                // Try inserting one by one to identify duplicates
                for (const key of batch) {
                    const { error: singleError } = await supabase
                        .from('amazon_activation_license_keys')
                        .insert({
                            license_key: key,
                            fsn: newFsn,
                            is_redeemed: false,
                        });

                    if (singleError) {
                        failedCount++;
                        if (errors.length < 5) {
                            errors.push(`${key.substring(0, 20)}...: ${singleError.message}`);
                        }
                    } else {
                        successCount++;
                    }
                }
            } else {
                successCount += data?.length || batch.length;
            }
        }

        setAddResult({ success: successCount, failed: failedCount, errors });

        if (successCount > 0) {
            fetchKeys();
            fetchStats();
        }

        if (failedCount === 0) {
            // Close modal if all succeeded
            setTimeout(() => {
                setNewKeys('');
                setNewFsn('');
                setProductName('');
                setAddResult(null);
                setMultiplyQuantity('');
                setIsModalOpen(false);
            }, 1500);
        }

        setIsSubmitting(false);
    };

    // Delete key
    const handleDeleteKey = async (id: string) => {
        if (!confirm('Are you sure you want to delete this key?')) return;

        setDeleteId(id);
        const { error } = await supabase
            .from('amazon_activation_license_keys')
            .delete()
            .eq('id', id);

        if (error) {
            alert(`Error deleting key: ${error.message}`);
        } else {
            fetchKeys();
            fetchStats();
        }
        setDeleteId(null);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setSelectedKeys(new Set()); // Clear selection on search
        fetchKeys();
    };

    // Toggle single key selection
    const toggleKeySelection = (keyId: string) => {
        setSelectedKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(keyId)) {
                newSet.delete(keyId);
            } else {
                newSet.add(keyId);
            }
            return newSet;
        });
    };

    // Toggle select all on current page
    const toggleSelectAll = () => {
        if (selectedKeys.size === keys.length) {
            setSelectedKeys(new Set());
        } else {
            setSelectedKeys(new Set(keys.map(k => k.id)));
        }
    };

    // Bulk delete selected keys
    const handleBulkDelete = async () => {
        if (selectedKeys.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedKeys.size} key(s)?`)) return;

        setIsBulkDeleting(true);
        const idsToDelete = Array.from(selectedKeys);
        let deleted = 0;

        // Delete in batches of 50
        for (let i = 0; i < idsToDelete.length; i += 50) {
            const batch = idsToDelete.slice(i, i + 50);
            const { error } = await supabase
                .from('amazon_activation_license_keys')
                .delete()
                .in('id', batch);

            if (!error) {
                deleted += batch.length;
            }
        }

        setSelectedKeys(new Set());
        setIsBulkDeleting(false);
        fetchKeys();
        fetchStats();
        alert(`Successfully deleted ${deleted} key(s)`);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const getProductName = (fsn: string) => {
        const mapping = fsnMappings.find(m => m.fsn === fsn);
        return mapping?.product_title || fsn;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">License Key Management</h1>
                    <p className="text-muted-foreground">Manage Amazon activation license keys</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                    <Plus className="h-4 w-4" />
                    Add Key
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => { setFilterRedeemed('available'); setDateFilter('all'); setCustomStartDate(''); setCustomEndDate(''); setCurrentPage(1); }}
                    className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-green-400 transition-all ${filterRedeemed === 'available' ? 'ring-2 ring-green-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-green-800 dark:text-green-400">{availableCount.toLocaleString()}</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Available Keys</p>
                </button>
                <button
                    onClick={() => { setFilterRedeemed('redeemed'); setCurrentPage(1); }}
                    className={`bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-left hover:ring-2 hover:ring-orange-400 transition-all ${filterRedeemed === 'redeemed' ? 'ring-2 ring-orange-400' : ''}`}
                >
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-400">{redeemedCount.toLocaleString()}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-500">Redeemed Keys</p>
                </button>
            </div>

            {/* Search and Filter */}
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by key or FSN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    />
                </div>
                <select
                    value={filterFsn}
                    onChange={(e) => { setFilterFsn(e.target.value); setCurrentPage(1); }}
                    className="px-4 py-2 border rounded-lg bg-background min-w-[180px]"
                >
                    <option value="all">All FSNs</option>
                    {fsnMappings.map(m => (
                        <option key={m.fsn} value={m.fsn}>{m.fsn}</option>
                    ))}
                </select>

                {/* Date Filter - Only show when viewing redeemed keys */}
                {filterRedeemed === 'redeemed' && (
                    <>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <select
                                value={dateFilter}
                                onChange={(e) => { setDateFilter(e.target.value as DateFilterType); setCurrentPage(1); }}
                                className="px-4 py-2 border rounded-lg bg-background min-w-[150px]"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {/* Custom Date Range Picker */}
                        {dateFilter === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                                    className="px-3 py-2 border rounded-lg bg-background text-sm"
                                    placeholder="Start Date"
                                />
                                <span className="text-muted-foreground">to</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                                    className="px-3 py-2 border rounded-lg bg-background text-sm"
                                    placeholder="End Date"
                                />
                            </div>
                        )}
                    </>
                )}

                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                    Search
                </button>
                {(filterFsn !== 'all' || filterRedeemed !== 'available' || dateFilter !== 'all') && (
                    <button
                        type="button"
                        onClick={() => {
                            setFilterFsn('all');
                            setFilterRedeemed('available');
                            setDateFilter('all');
                            setCustomStartDate('');
                            setCustomEndDate('');
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border rounded-lg hover:bg-accent"
                    >
                        Clear Filters
                    </button>
                )}
            </form>

            {/* Selection Toolbar */}
            {selectedKeys.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <span className="text-sm font-medium">
                        {selectedKeys.size} key(s) selected
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {isBulkDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
                                Delete Selected
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Keys - Mobile Cards View */}
            <div className="lg:hidden space-y-3">
                {isLoading ? (
                    <div className="p-8 text-center bg-card border rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading keys...</p>
                    </div>
                ) : (
                    <>
                        {keys.map((key) => (
                            <div key={key.id} className={`bg-card border rounded-lg p-4 ${selectedKeys.has(key.id) ? 'ring-2 ring-primary' : ''}`}>
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedKeys.has(key.id)}
                                        onChange={() => toggleKeySelection(key.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-sm truncate">{key.license_key}</p>
                                        <p className="text-sm font-medium text-muted-foreground mt-1">{key.fsn}</p>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{getProductName(key.fsn)}</p>
                                        <div className="mt-2">
                                            {key.is_redeemed ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                                    <CheckCircle className="h-3 w-3" /> Redeemed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <Key className="h-3 w-3" /> Available
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteKey(key.id)}
                                        disabled={deleteId === key.id}
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                                        title="Delete Key"
                                    >
                                        {deleteId === key.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {keys.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground bg-card border rounded-lg">
                                No license keys found
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Keys Table - Desktop View */}
            <div className="hidden lg:block bg-card border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading keys...</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium w-10">
                                        <input
                                            type="checkbox"
                                            checked={keys.length > 0 && selectedKeys.size === keys.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">License Key</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">FSN</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Product Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {keys.map((key) => (
                                    <tr key={key.id} className={`hover:bg-muted/30 ${selectedKeys.has(key.id) ? 'bg-primary/10' : ''}`}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedKeys.has(key.id)}
                                                onChange={() => toggleKeySelection(key.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm">{key.license_key}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{key.fsn}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                                            {getProductName(key.fsn)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {key.is_redeemed ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                    <CheckCircle className="h-3 w-3" /> Redeemed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <Key className="h-3 w-3" /> Available
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDeleteKey(key.id)}
                                                disabled={deleteId === key.id}
                                                className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                                title="Delete Key"
                                            >
                                                {deleteId === key.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {keys.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No license keys found
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} keys
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-2 text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Add Key Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => { setIsModalOpen(false); setAddResult(null); }} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-lg m-4">
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Add License Keys (Bulk)</h2>
                            <button onClick={() => { setIsModalOpen(false); setAddResult(null); }} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddKey} className="p-6 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium">License Keys *</label>
                                    <span className="text-xs text-muted-foreground">
                                        {newKeys.split('\n').filter(k => k.trim()).length} key(s)
                                    </span>
                                </div>
                                <textarea
                                    value={newKeys}
                                    onChange={(e) => setNewKeys(e.target.value)}
                                    placeholder="Paste license keys here (one per line)&#10;XXXXX-XXXXX-XXXXX-XXXXX-XXXXX&#10;XXXXX-XXXXX-XXXXX-XXXXX-XXXXX&#10;XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                                    className="w-full px-4 py-3 border rounded-lg bg-background font-mono text-sm min-h-[150px] resize-y"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Enter one license key per line. Empty lines will be ignored.
                                </p>
                            </div>

                            {/* Quantity Multiplier */}
                            <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                                <label className="block text-sm font-medium mb-2">Multiply Keys (Optional)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={multiplyQuantity}
                                        onChange={(e) => setMultiplyQuantity(e.target.value ? parseInt(e.target.value) : '')}
                                        placeholder="Quantity"
                                        className="w-32 px-3 py-2 border rounded-lg bg-background text-sm"
                                    />
                                    <span className="text-xs text-muted-foreground flex-1">
                                        Enter quantity to create unique variants with suffixes (-, ~, &apos;, =, +, _)
                                    </span>
                                </div>
                                {multiplyQuantity && multiplyQuantity > 0 && (
                                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                                        Will generate {multiplyQuantity} unique keys per line = {newKeys.split('\n').filter(k => k.trim()).length * multiplyQuantity} total keys
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">FSN *</label>
                                <select
                                    value={newFsn}
                                    onChange={(e) => handleFsnChange(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg bg-background"
                                    required
                                >
                                    <option value="">Select FSN</option>
                                    {fsnMappings.map(m => (
                                        <option key={m.fsn} value={m.fsn}>{m.fsn}</option>
                                    ))}
                                </select>
                            </div>

                            {productName && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Product Name</label>
                                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{productName}</span>
                                    </div>
                                </div>
                            )}

                            {/* Result Feedback */}
                            {addResult && (
                                <div className={`p-3 rounded-lg ${addResult.failed > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {addResult.failed > 0 ? (
                                            <AlertCircle className="h-4 w-4 text-orange-600" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        )}
                                        <span className={`font-medium ${addResult.failed > 0 ? 'text-orange-800' : 'text-green-800'}`}>
                                            {addResult.success} key(s) added successfully
                                            {addResult.failed > 0 && `, ${addResult.failed} failed`}
                                        </span>
                                    </div>
                                    {addResult.errors.length > 0 && (
                                        <ul className="text-xs text-orange-700 mt-2 space-y-1">
                                            {addResult.errors.map((err, i) => (
                                                <li key={i} className="font-mono truncate">{err}</li>
                                            ))}
                                            {addResult.failed > 5 && (
                                                <li className="text-muted-foreground">... and {addResult.failed - 5} more errors</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setAddResult(null); }}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newKeys.trim() || !newFsn}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4" />
                                            Add Keys
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
