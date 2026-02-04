'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Trash2,
    Edit2,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    Store,
    RefreshCw,
    TestTube,
    Eye,
    EyeOff,
    X,
    Save,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface SellerAccount {
    id: string;
    name: string;
    merchantToken: string;
    marketplaceId: string;
    priority: number;
    isActive: boolean;
    lastSyncAt: string | null;
    lastSyncStatus: string | null;
    ordersSyncedCount: number;
    createdAt: string;
    updatedAt: string;
}

interface AccountFormData {
    name: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    merchantToken: string;
    marketplaceId: string;
    priority: number;
}

const initialFormData: AccountFormData = {
    name: '',
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    merchantToken: '',
    marketplaceId: 'A21TJRUUN4KGV',
    priority: 100,
};

export default function SellerAccountsPage() {
    const [accounts, setAccounts] = useState<SellerAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<AccountFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [showSecrets, setShowSecrets] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchAccounts = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/seller-accounts');
            const data = await response.json();
            if (data.accounts) {
                setAccounts(data.accounts);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to fetch seller accounts');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const openAddModal = () => {
        setFormData(initialFormData);
        setIsEditing(false);
        setEditingId(null);
        setShowSecrets(false);
        setIsModalOpen(true);
    };

    const openEditModal = (account: SellerAccount) => {
        setFormData({
            name: account.name,
            clientId: '',
            clientSecret: '',
            refreshToken: '',
            merchantToken: account.merchantToken,
            marketplaceId: account.marketplaceId,
            priority: account.priority,
        });
        setIsEditing(true);
        setEditingId(account.id);
        setShowSecrets(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormData);
        setIsEditing(false);
        setEditingId(null);
    };

    const testCredentials = async () => {
        if (!formData.clientId || !formData.clientSecret || !formData.refreshToken) {
            toast.error('Please fill in all credential fields to test');
            return;
        }

        setIsTesting(true);
        try {
            const response = await fetch('/api/admin/seller-accounts/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: formData.clientId,
                    clientSecret: formData.clientSecret,
                    refreshToken: formData.refreshToken,
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success('✅ Credentials verified successfully!');
            } else {
                toast.error(`❌ Invalid credentials: ${data.error}`);
            }
        } catch (error) {
            console.error('Error testing credentials:', error);
            toast.error('Failed to test credentials');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.merchantToken) {
            toast.error('Please fill in account name and merchant token');
            return;
        }

        // For new accounts, require all credentials
        if (!isEditing && (!formData.clientId || !formData.clientSecret || !formData.refreshToken)) {
            toast.error('Please fill in all credential fields');
            return;
        }

        setIsSaving(true);
        try {
            if (isEditing && editingId) {
                // Update existing account
                const updateData: Partial<AccountFormData> = {
                    name: formData.name,
                    merchantToken: formData.merchantToken,
                    marketplaceId: formData.marketplaceId,
                    priority: formData.priority,
                };

                // Only include credentials if they were provided
                if (formData.clientId) updateData.clientId = formData.clientId;
                if (formData.clientSecret) updateData.clientSecret = formData.clientSecret;
                if (formData.refreshToken) updateData.refreshToken = formData.refreshToken;

                const response = await fetch(`/api/admin/seller-accounts/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData),
                });

                if (!response.ok) {
                    throw new Error('Failed to update account');
                }

                toast.success('Account updated successfully!');
            } else {
                // Add new account
                const response = await fetch('/api/admin/seller-accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    throw new Error('Failed to add account');
                }

                toast.success('Account added successfully!');
            }

            closeModal();
            fetchAccounts();
        } catch (error) {
            console.error('Error saving account:', error);
            toast.error(isEditing ? 'Failed to update account' : 'Failed to add account');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleAccountStatus = async (account: SellerAccount) => {
        setTogglingId(account.id);
        try {
            const response = await fetch(`/api/admin/seller-accounts/${account.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !account.isActive }),
            });

            if (!response.ok) {
                throw new Error('Failed to toggle status');
            }

            toast.success(`Account ${account.isActive ? 'disabled' : 'enabled'}`);
            fetchAccounts();
        } catch (error) {
            console.error('Error toggling account:', error);
            toast.error('Failed to toggle account status');
        } finally {
            setTogglingId(null);
        }
    };

    const updatePriority = async (account: SellerAccount, direction: 'up' | 'down') => {
        const newPriority = direction === 'up' ? account.priority - 10 : account.priority + 10;
        if (newPriority < 1) return;

        try {
            const response = await fetch(`/api/admin/seller-accounts/${account.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority }),
            });

            if (!response.ok) {
                throw new Error('Failed to update priority');
            }

            fetchAccounts();
        } catch (error) {
            console.error('Error updating priority:', error);
            toast.error('Failed to update priority');
        }
    };

    const deleteAccount = async (id: string) => {
        if (!confirm('Are you sure you want to delete this seller account? This will unlink all associated orders.')) {
            return;
        }

        setDeletingId(id);
        try {
            const response = await fetch(`/api/admin/seller-accounts/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            toast.success('Account deleted successfully');
            fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Failed to delete account');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Store className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                        Seller Accounts
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage Amazon SP API credentials
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    Add Account
                </button>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">How it works</p>
                    <p className="mt-1">
                        Add your Amazon SP API credentials here. All cron jobs (order sync, refund sync, review requests)
                        will automatically run for all active accounts <strong>in priority order</strong>.
                        Lower priority numbers are processed first. Credentials are encrypted at rest.
                    </p>
                </div>
            </div>

            {/* Accounts List */}
            {isLoading ? (
                <div className="p-12 text-center bg-card border rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Loading accounts...</p>
                </div>
            ) : accounts.length === 0 ? (
                <div className="p-12 text-center bg-card border rounded-lg">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium">No seller accounts yet</p>
                    <p className="text-muted-foreground mt-1">
                        Add your first Amazon seller account to get started
                    </p>
                    <button
                        onClick={openAddModal}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Account
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map((account, index) => (
                        <div
                            key={account.id}
                            className={`bg-card border rounded-lg transition-all ${account.isActive
                                ? 'border-green-500/30 bg-gradient-to-r from-green-500/5 to-transparent'
                                : 'border-gray-300 dark:border-gray-700 opacity-60'
                                }`}
                        >
                            {/* Mobile Layout */}
                            <div className="lg:hidden p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-sm font-bold">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg font-semibold truncate">{account.name}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                {account.isActive ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                        <XCircle className="h-3 w-3" />
                                                        Disabled
                                                    </span>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    Priority: {account.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-muted/30 rounded p-2">
                                        <p className="text-xs text-muted-foreground">Merchant Token</p>
                                        <p className="font-mono text-xs truncate">{account.merchantToken}</p>
                                    </div>
                                    <div className="bg-muted/30 rounded p-2">
                                        <p className="text-xs text-muted-foreground">Orders</p>
                                        <p className="font-medium">{account.ordersSyncedCount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        {account.lastSyncStatus === 'success' ? (
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                        ) : account.lastSyncStatus ? (
                                            <XCircle className="h-3 w-3 text-red-500" />
                                        ) : null}
                                        {formatDate(account.lastSyncAt)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updatePriority(account, 'up')} disabled={account.priority <= 1} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-30" title="Move up">
                                            <ArrowUp className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => updatePriority(account, 'down')} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" title="Move down">
                                            <ArrowDown className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => toggleAccountStatus(account)} disabled={togglingId === account.id} className={`p-1.5 rounded transition-colors ${account.isActive ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30' : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'} disabled:opacity-50`} title={account.isActive ? 'Disable' : 'Enable'}>
                                            {togglingId === account.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                        </button>
                                        <button onClick={() => openEditModal(account)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors" title="Edit">
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => deleteAccount(account.id)} disabled={deletingId === account.id} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50" title="Delete">
                                            {deletingId === account.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Layout - Compact Horizontal */}
                            <div className="hidden lg:flex items-center gap-4 px-4 py-3">
                                {/* Priority */}
                                <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-sm font-bold">
                                    {index + 1}
                                </span>

                                {/* Name & Status */}
                                <div className="w-40 flex-shrink-0">
                                    <h3 className="font-semibold truncate">{account.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {account.isActive ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                <CheckCircle className="h-3 w-3" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                <XCircle className="h-3 w-3" />
                                                Disabled
                                            </span>
                                        )}
                                        <span className="text-xs text-muted-foreground">P:{account.priority}</span>
                                    </div>
                                </div>

                                {/* Merchant Token */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">Merchant Token</p>
                                    <p className="font-mono text-sm truncate">{account.merchantToken}</p>
                                </div>

                                {/* Marketplace */}
                                <div className="w-24 flex-shrink-0 text-center">
                                    <p className="text-xs text-muted-foreground">Marketplace</p>
                                    <p className="text-sm">{account.marketplaceId === 'A21TJRUUN4KGV' ? '🇮🇳 India' : account.marketplaceId.slice(0, 8)}</p>
                                </div>

                                {/* Orders */}
                                <div className="w-20 flex-shrink-0 text-center">
                                    <p className="text-xs text-muted-foreground">Orders Synced</p>
                                    <p className="font-semibold">{account.ordersSyncedCount.toLocaleString()}</p>
                                </div>

                                {/* Last Sync */}
                                <div className="w-36 flex-shrink-0">
                                    <p className="text-xs text-muted-foreground">Last Sync</p>
                                    <div className="flex items-center gap-1 text-sm">
                                        {account.lastSyncStatus === 'success' ? (
                                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                        ) : account.lastSyncStatus ? (
                                            <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                        ) : null}
                                        <span className="truncate">{formatDate(account.lastSyncAt)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <button onClick={() => updatePriority(account, 'up')} disabled={account.priority <= 1} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-30" title="Move up">
                                        <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => updatePriority(account, 'down')} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" title="Move down">
                                        <ArrowDown className="h-4 w-4" />
                                    </button>
                                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
                                    <button onClick={() => toggleAccountStatus(account)} disabled={togglingId === account.id} className={`p-1.5 rounded transition-colors ${account.isActive ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30' : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'} disabled:opacity-50`} title={account.isActive ? 'Disable' : 'Enable'}>
                                        {togglingId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    </button>
                                    <button onClick={() => openEditModal(account)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors" title="Edit">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => deleteAccount(account.id)} disabled={deletingId === account.id} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50" title="Delete">
                                        {deletingId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                {isEditing ? 'Edit Seller Account' : 'Add Seller Account'}
                            </h2>
                            <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Account Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Account Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., SimplySolutions Main"
                                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>

                            {/* Merchant Token */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Merchant/Seller Token *</label>
                                <input
                                    type="text"
                                    value={formData.merchantToken}
                                    onChange={(e) => setFormData({ ...formData, merchantToken: e.target.value })}
                                    placeholder="e.g., AEPNW09XFGY8X"
                                    className="w-full px-3 py-2 border rounded-lg bg-background font-mono focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Marketplace */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Marketplace</label>
                                    <select
                                        value={formData.marketplaceId}
                                        onChange={(e) => setFormData({ ...formData, marketplaceId: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="A21TJRUUN4KGV">🇮🇳 India</option>
                                        <option value="A2EUQ1WTGCTBG2">🇨🇦 Canada</option>
                                        <option value="ATVPDKIKX0DER">🇺🇸 United States</option>
                                        <option value="A1F83G8C2ARO7P">🇬🇧 United Kingdom</option>
                                    </select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Priority</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                                        className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-orange-500"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Lower = processed first</p>
                                </div>
                            </div>

                            <hr className="my-4" />

                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    SP API Credentials
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowSecrets(!showSecrets)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    {showSecrets ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    {showSecrets ? 'Hide' : 'Show'}
                                </button>
                            </div>

                            {isEditing && (
                                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                    Leave credential fields empty to keep existing values
                                </p>
                            )}

                            {/* Client ID */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Client ID {!isEditing && '*'}
                                </label>
                                <input
                                    type={showSecrets ? 'text' : 'password'}
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    placeholder="amzn1.application-oa2-client.xxxxx"
                                    className="w-full px-3 py-2 border rounded-lg bg-background font-mono text-sm focus:ring-2 focus:ring-orange-500"
                                    required={!isEditing}
                                />
                            </div>

                            {/* Client Secret */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Client Secret {!isEditing && '*'}
                                </label>
                                <input
                                    type={showSecrets ? 'text' : 'password'}
                                    value={formData.clientSecret}
                                    onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                                    placeholder="amzn1.oa2-cs.v1.xxxxx"
                                    className="w-full px-3 py-2 border rounded-lg bg-background font-mono text-sm focus:ring-2 focus:ring-orange-500"
                                    required={!isEditing}
                                />
                            </div>

                            {/* Refresh Token */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Refresh Token {!isEditing && '*'}
                                </label>
                                <textarea
                                    value={formData.refreshToken}
                                    onChange={(e) => setFormData({ ...formData, refreshToken: e.target.value })}
                                    placeholder="Atzr|IwEBIOuCzP5..."
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg bg-background font-mono text-sm focus:ring-2 focus:ring-orange-500 resize-none"
                                    required={!isEditing}
                                />
                            </div>

                            {/* Test Credentials Button */}
                            {(formData.clientId && formData.clientSecret && formData.refreshToken) && (
                                <button
                                    type="button"
                                    onClick={testCredentials}
                                    disabled={isTesting}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                                >
                                    {isTesting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <TestTube className="h-4 w-4" />
                                    )}
                                    Test Credentials
                                </button>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {isEditing ? 'Update Account' : 'Add Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
