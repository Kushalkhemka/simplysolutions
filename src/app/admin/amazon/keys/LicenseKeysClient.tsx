'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Plus, Trash2, Key, Package, ChevronLeft, ChevronRight, Loader2, X, CheckCircle, AlertCircle, Upload } from 'lucide-react';

interface LicenseKey {
    id: string;
    license_key: string;
    fsn: string;
    is_redeemed: boolean;
    order_id: string | null;
    created_at: string;
}

interface FsnMapping {
    fsn: string;
    product_title: string;
}

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

    // Add key form
    const [newKeys, setNewKeys] = useState('');
    const [newFsn, setNewFsn] = useState('');
    const [productName, setProductName] = useState('');
    const [addResult, setAddResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

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
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching keys:', error);
        } else {
            setKeys(data || []);
            setTotalCount(count || 0);
        }
        setIsLoading(false);
    }, [currentPage, searchQuery, filterFsn, filterRedeemed, supabase]);

    useEffect(() => {
        fetchFsnMappings();
        fetchStats();
    }, [fetchFsnMappings, fetchStats]);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

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
        const keysToAdd = newKeys
            .split('\n')
            .map(key => key.trim())
            .filter(key => key.length > 0);

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
        fetchKeys();
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
                    onClick={() => { setFilterRedeemed('available'); setCurrentPage(1); }}
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
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                    Search
                </button>
                {(filterFsn !== 'all' || filterRedeemed !== 'available') && (
                    <button
                        type="button"
                        onClick={() => { setFilterFsn('all'); setFilterRedeemed('available'); setCurrentPage(1); }}
                        className="px-4 py-2 border rounded-lg hover:bg-accent"
                    >
                        Clear Filters
                    </button>
                )}
            </form>

            {/* Keys Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
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
                                    <th className="px-4 py-3 text-left text-sm font-medium">License Key</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">FSN</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Product Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {keys.map((key) => (
                                    <tr key={key.id} className="hover:bg-muted/30">
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
