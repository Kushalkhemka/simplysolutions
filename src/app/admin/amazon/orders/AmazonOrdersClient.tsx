'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, X, Package, Key, Fingerprint, ShieldCheck, Calendar, Loader2, Edit2, Save, Phone, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { isComboProduct } from '@/lib/amazon/combo-products';

interface AmazonOrder {
    id: string;
    order_id: string;
    fsn: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    warranty_status: string;
    fulfillment_type: string;
    getcid_used: boolean;
    getcid_count: number | null;
    quantity: number | null;
    installation_id: string | null;
    confirmation_id: string | null;
    product_title: string | null;
    license_key_id: string | null;
    created_at: string;
    updated_at: string;
}

interface LicenseKey {
    id: string;
    license_key: string;
    fsn: string | null;
    is_redeemed: boolean;
    created_at: string;
}

interface ProductData {
    id: string;
    fsn: string;
    product_title: string;
    product_image: string | null;
    download_link: string | null;
}

interface OrderDetails extends AmazonOrder {
    license_key?: LicenseKey | null;
    license_keys?: LicenseKey[]; // For combo/multi-key orders
    productData?: ProductData | null;
}

export default function AmazonOrdersClient() {
    const [orders, setOrders] = useState<AmazonOrder[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // License key editing state
    const [isEditingKeys, setIsEditingKeys] = useState(false);
    const [editedKeys, setEditedKeys] = useState<{ id: string, license_key: string }[]>([]);
    const [isSavingKeys, setIsSavingKeys] = useState(false);

    // Order editing state
    const [isEditingOrder, setIsEditingOrder] = useState(false);
    const [editedOrder, setEditedOrder] = useState<{
        fsn: string;
        product_title: string;
        installation_id: string;
        confirmation_id: string;
        contact_email: string;
        contact_phone: string;
    } | null>(null);
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    // Status update state
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Filter state
    const [filterFsn, setFilterFsn] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterGetcid, setFilterGetcid] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [uniqueFsns, setUniqueFsns] = useState<string[]>([]);

    const pageSize = 50;
    const supabase = createClient();

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('amazon_orders')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (searchQuery) {
            query = query.or(`order_id.ilike.%${searchQuery}%,fsn.ilike.%${searchQuery}%`);
        }

        // Apply filters
        if (filterFsn !== 'all') {
            query = query.eq('fsn', filterFsn);
        }
        if (filterType !== 'all') {
            query = query.eq('fulfillment_type', filterType);
        }
        if (filterGetcid !== 'all') {
            query = query.eq('getcid_used', filterGetcid === 'used');
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);
            setTotalCount(count || 0);
        }
        setIsLoading(false);
    }, [currentPage, searchQuery, filterFsn, filterType, filterGetcid, supabase]);

    // Fetch unique FSNs for filter dropdown
    const fetchUniqueFsns = useCallback(async () => {
        const { data } = await supabase
            .from('amazon_orders')
            .select('fsn')
            .not('fsn', 'is', null);

        if (data) {
            const fsns = [...new Set(data.map(d => d.fsn).filter(Boolean))].sort();
            setUniqueFsns(fsns as string[]);
        }
    }, [supabase]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        fetchUniqueFsns();
    }, [fetchUniqueFsns]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchOrders();
    };

    const viewOrderDetails = async (order: AmazonOrder) => {
        setIsLoadingDetails(true);
        setIsModalOpen(true);

        let licenseKey: LicenseKey | null = null;
        let licenseKeys: LicenseKey[] = [];
        let productData: ProductData | null = null;

        // Fetch ALL license keys by order_id (for combo/multi-key orders)
        const { data: keysByOrderId } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key, fsn, is_redeemed, created_at')
            .eq('order_id', order.order_id)
            .order('created_at', { ascending: true });

        if (keysByOrderId && keysByOrderId.length > 0) {
            licenseKeys = keysByOrderId;
            licenseKey = keysByOrderId[0]; // For backward compatibility
        } else if (order.license_key_id) {
            // Fallback to license_key_id lookup
            const { data } = await supabase
                .from('amazon_activation_license_keys')
                .select('id, license_key, fsn, is_redeemed, created_at')
                .eq('id', order.license_key_id)
                .single();

            if (data) {
                licenseKey = data;
                licenseKeys = [data];
            }
        }

        // Fetch product data from products_data table by FSN
        if (order.fsn) {
            const { data: prodData } = await supabase
                .from('products_data')
                .select('id, fsn, product_title, product_image, download_link')
                .eq('fsn', order.fsn)
                .single();

            if (prodData) {
                productData = prodData;
            }
        }

        setSelectedOrder({
            ...order,
            license_key: licenseKey,
            license_keys: licenseKeys,
            productData: productData
        });
        setIsLoadingDetails(false);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
        setIsEditingKeys(false);
        setEditedKeys([]);
        setIsEditingOrder(false);
        setEditedOrder(null);
    };

    // Start editing order fields
    const startEditingOrder = () => {
        if (selectedOrder) {
            setEditedOrder({
                fsn: selectedOrder.fsn || '',
                product_title: selectedOrder.product_title || '',
                installation_id: selectedOrder.installation_id || '',
                confirmation_id: selectedOrder.confirmation_id || '',
                contact_email: selectedOrder.contact_email || '',
                contact_phone: selectedOrder.contact_phone || '',
            });
            setIsEditingOrder(true);
        }
    };

    const cancelEditingOrder = () => {
        setIsEditingOrder(false);
        setEditedOrder(null);
    };

    const saveOrderChanges = async () => {
        if (!selectedOrder || !editedOrder) return;

        setIsSavingOrder(true);
        try {
            const { error } = await supabase
                .from('amazon_orders')
                .update({
                    fsn: editedOrder.fsn || null,
                    product_title: editedOrder.product_title || null,
                    installation_id: editedOrder.installation_id || null,
                    confirmation_id: editedOrder.confirmation_id || null,
                    contact_email: editedOrder.contact_email || null,
                    contact_phone: editedOrder.contact_phone || null,
                    updated_at: new Date().toISOString()
                })
                .eq('order_id', selectedOrder.order_id);

            if (error) throw error;

            // Update local state
            setSelectedOrder({
                ...selectedOrder,
                fsn: editedOrder.fsn || null,
                product_title: editedOrder.product_title || null,
                installation_id: editedOrder.installation_id || null,
                confirmation_id: editedOrder.confirmation_id || null,
                contact_email: editedOrder.contact_email || null,
                contact_phone: editedOrder.contact_phone || null,
            });
            setOrders(prev => prev.map(o =>
                o.order_id === selectedOrder.order_id
                    ? {
                        ...o,
                        fsn: editedOrder.fsn || null,
                        product_title: editedOrder.product_title || null,
                        installation_id: editedOrder.installation_id || null,
                        confirmation_id: editedOrder.confirmation_id || null,
                        contact_email: editedOrder.contact_email || null,
                        contact_phone: editedOrder.contact_phone || null,
                    }
                    : o
            ));

            toast.success('Order updated successfully!');
            setIsEditingOrder(false);
            setEditedOrder(null);
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Failed to update order');
        } finally {
            setIsSavingOrder(false);
        }
    };

    const startEditingKeys = () => {
        if (selectedOrder?.license_keys) {
            setEditedKeys(selectedOrder.license_keys.map(k => ({ id: k.id, license_key: k.license_key })));
            setIsEditingKeys(true);
        }
    };

    const cancelEditingKeys = () => {
        setIsEditingKeys(false);
        setEditedKeys([]);
    };

    const updateEditedKey = (id: string, newKey: string) => {
        setEditedKeys(prev => prev.map(k => k.id === id ? { ...k, license_key: newKey } : k));
    };

    const saveLicenseKeys = async () => {
        setIsSavingKeys(true);
        try {
            // Update each license key in the database
            for (const key of editedKeys) {
                const { error } = await supabase
                    .from('amazon_activation_license_keys')
                    .update({ license_key: key.license_key })
                    .eq('id', key.id);

                if (error) {
                    throw error;
                }
            }

            // Update the local state
            if (selectedOrder) {
                const updatedKeys = selectedOrder.license_keys?.map(k => {
                    const edited = editedKeys.find(e => e.id === k.id);
                    return edited ? { ...k, license_key: edited.license_key } : k;
                });
                setSelectedOrder({
                    ...selectedOrder,
                    license_keys: updatedKeys,
                    license_key: updatedKeys?.[0] || null
                });
            }

            toast.success('License keys updated successfully!');
            setIsEditingKeys(false);
            setEditedKeys([]);
        } catch (error) {
            console.error('Error updating license keys:', error);
            toast.error('Failed to update license keys');
        } finally {
            setIsSavingKeys(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" /> Approved</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3" /> Rejected</span>;
            case 'BLOCKED':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-900 text-white"><Ban className="h-3 w-3" /> Blocked</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3" /> Pending</span>;
        }
    };

    // Update order warranty status
    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setIsUpdatingStatus(true);
        try {
            const response = await fetch('/api/admin/amazon-orders/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update status');
            }

            // Update local state
            if (selectedOrder) {
                setSelectedOrder({ ...selectedOrder, warranty_status: newStatus });
            }
            setOrders(prev => prev.map(o =>
                o.order_id === orderId ? { ...o, warranty_status: newStatus } : o
            ));

            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Amazon Orders</h1>
                    <p className="text-muted-foreground">Manage Amazon activation orders ({totalCount.toLocaleString()} total)</p>
                </div>
            </div>

            {/* Search and Filter */}
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by Order ID or FSN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    />
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                    Search
                </button>
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent ${showFilters ? 'bg-accent' : ''}`}
                >
                    <Filter className="h-4 w-4" />
                    Filter
                </button>
                {(filterFsn !== 'all' || filterType !== 'all' || filterGetcid !== 'all') && (
                    <button
                        type="button"
                        onClick={() => {
                            setFilterFsn('all');
                            setFilterType('all');
                            setFilterGetcid('all');
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        Clear Filters
                    </button>
                )}
            </form>

            {/* Filter Dropdowns */}
            {showFilters && (
                <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium mb-1">FSN</label>
                        <select
                            value={filterFsn}
                            onChange={(e) => { setFilterFsn(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border rounded-lg bg-background min-w-[200px]"
                        >
                            <option value="all">All FSNs</option>
                            {uniqueFsns.map(fsn => (
                                <option key={fsn} value={fsn}>{fsn}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Fulfillment Type</label>
                        <select
                            value={filterType}
                            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border rounded-lg bg-background min-w-[150px]"
                        >
                            <option value="all">All Types</option>
                            <option value="amazon_fba">FBA</option>
                            <option value="amazon_mfn">Digital/MFN</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">GetCID Status</label>
                        <select
                            value={filterGetcid}
                            onChange={(e) => { setFilterGetcid(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border rounded-lg bg-background min-w-[150px]"
                        >
                            <option value="all">All</option>
                            <option value="used">Used</option>
                            <option value="not_used">Not Used</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading orders...</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Order ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">FSN</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Redeemed</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Warranty</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">GetCID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-sm">{order.order_id}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{order.fsn || '-'}</td>
                                        <td className="px-4 py-3 text-sm">{order.contact_email || order.contact_phone || '-'}</td>
                                        <td className="px-4 py-3">
                                            {order.license_key_id ? (
                                                <span
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-help"
                                                    title="Click view to see license key"
                                                >
                                                    ✓ Yes
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                    ✗ No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{getStatusBadge(order.warranty_status)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs ${order.fulfillment_type === 'amazon_fba' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {order.fulfillment_type === 'amazon_fba' ? 'FBA' : 'Digital'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.getcid_used ? (
                                                <span className="text-green-600 text-sm">Used</span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => viewOrderDetails(order)}
                                                className="text-primary hover:text-primary/80 transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {orders.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No orders found
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} orders
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

            {/* Order Details Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Order Details</h2>
                            <div className="flex items-center gap-2">
                                {!isEditingOrder ? (
                                    <button
                                        onClick={startEditingOrder}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Edit Order
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={cancelEditingOrder}
                                            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors"
                                            disabled={isSavingOrder}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={saveOrderChanges}
                                            disabled={isSavingOrder}
                                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            {isSavingOrder ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                            Save Changes
                                        </button>
                                    </>
                                )}
                                <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {isLoadingDetails ? (
                            <div className="p-8 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="mt-2 text-muted-foreground">Loading order details...</p>
                            </div>
                        ) : selectedOrder && (
                            <div className="p-6 space-y-4">
                                {/* Product Image & Name */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    {selectedOrder.productData?.product_image ? (
                                        <img
                                            src={selectedOrder.productData.product_image}
                                            alt={selectedOrder.productData.product_title}
                                            className="w-16 h-16 object-contain rounded-lg bg-white border"
                                        />
                                    ) : (
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <Package className="h-5 w-5 text-orange-600" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Product Name</p>
                                        {isEditingOrder && editedOrder ? (
                                            <input
                                                type="text"
                                                value={editedOrder.product_title}
                                                onChange={(e) => setEditedOrder({ ...editedOrder, product_title: e.target.value })}
                                                className="w-full font-medium text-lg p-2 border rounded-lg bg-background focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter product name..."
                                            />
                                        ) : (
                                            <p className="font-medium text-lg">
                                                {selectedOrder.productData?.product_title || selectedOrder.product_title || selectedOrder.fsn || 'Not Available'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Order ID */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Package className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Order ID</p>
                                        <p className="font-mono font-medium">{selectedOrder.order_id}</p>
                                    </div>
                                </div>

                                {/* License Key(s) */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Key className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                License Key{selectedOrder.license_keys && selectedOrder.license_keys.length > 1 ? 's' : ''}
                                                {selectedOrder.license_keys && selectedOrder.license_keys.length > 1 && (
                                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                        {selectedOrder.license_keys.length} keys (Combo)
                                                    </span>
                                                )}
                                            </p>
                                            {selectedOrder.license_keys && selectedOrder.license_keys.length > 0 && !isEditingKeys && (
                                                <button
                                                    onClick={startEditingKeys}
                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="Edit license keys"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    Edit
                                                </button>
                                            )}
                                            {isEditingKeys && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={cancelEditingKeys}
                                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                        disabled={isSavingKeys}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={saveLicenseKeys}
                                                        disabled={isSavingKeys}
                                                        className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {isSavingKeys ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Save className="h-3 w-3" />
                                                        )}
                                                        Save
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {selectedOrder.license_keys && selectedOrder.license_keys.length > 0 ? (
                                            <div className="space-y-2 mt-2">
                                                {isEditingKeys ? (
                                                    // Editable mode
                                                    editedKeys.map((key, index) => {
                                                        const originalKey = selectedOrder.license_keys?.find(k => k.id === key.id);
                                                        return (
                                                            <div key={key.id} className="p-2 bg-white dark:bg-slate-800 rounded border border-blue-300">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                                                    {originalKey?.fsn && (
                                                                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                                                            {originalKey.fsn}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                                        Editing
                                                                    </span>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={key.license_key}
                                                                    onChange={(e) => updateEditedKey(key.id, e.target.value)}
                                                                    className="w-full font-mono text-sm p-2 border rounded bg-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    placeholder="Enter license key..."
                                                                />
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    // View mode
                                                    selectedOrder.license_keys.map((key, index) => (
                                                        <div key={key.id} className="p-2 bg-white dark:bg-slate-800 rounded border">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                                                {key.fsn && (
                                                                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                                                        {key.fsn}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="font-mono font-medium break-all mt-1">{key.license_key}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        ) : (
                                            <p className="font-mono font-medium break-all">
                                                <span className="text-muted-foreground italic">Not Assigned</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* FSN */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Package className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">FSN</p>
                                        {isEditingOrder && editedOrder ? (
                                            <select
                                                value={editedOrder.fsn}
                                                onChange={(e) => setEditedOrder({ ...editedOrder, fsn: e.target.value })}
                                                className="w-full font-mono p-2 border rounded-lg bg-background focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select FSN...</option>
                                                {uniqueFsns.map(fsn => (
                                                    <option key={fsn} value={fsn}>{fsn}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="font-mono font-medium">
                                                {selectedOrder.fsn || selectedOrder.license_key?.fsn || <span className="text-muted-foreground italic">Not Available</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Installation ID */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <Fingerprint className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Installation ID</p>
                                        {isEditingOrder && editedOrder ? (
                                            <input
                                                type="text"
                                                value={editedOrder.installation_id}
                                                onChange={(e) => setEditedOrder({ ...editedOrder, installation_id: e.target.value })}
                                                className="w-full font-mono p-2 border rounded-lg bg-background focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter installation ID..."
                                            />
                                        ) : (
                                            <p className="font-mono font-medium break-all">
                                                {selectedOrder.installation_id || <span className="text-muted-foreground italic">Not Available</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Confirmation ID */}
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="p-2 bg-teal-100 rounded-lg">
                                        <ShieldCheck className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Confirmation ID</p>
                                        {isEditingOrder && editedOrder ? (
                                            <input
                                                type="text"
                                                value={editedOrder.confirmation_id}
                                                onChange={(e) => setEditedOrder({ ...editedOrder, confirmation_id: e.target.value })}
                                                className="w-full font-mono p-2 border rounded-lg bg-background focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter confirmation ID..."
                                            />
                                        ) : (
                                            <p className="font-mono font-medium break-all">
                                                {selectedOrder.confirmation_id || <span className="text-muted-foreground italic">Not Available</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Timestamps */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <Calendar className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Created At</p>
                                            <p className="font-medium text-sm">{formatDate(selectedOrder.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div className="p-2 bg-indigo-100 rounded-lg">
                                            <Calendar className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Modified</p>
                                            <p className="font-medium text-sm">{formatDate(selectedOrder.updated_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Info */}
                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Warranty Status</p>
                                        <div className="mt-1 flex items-center gap-3">
                                            {getStatusBadge(selectedOrder.warranty_status)}
                                            <select
                                                value={selectedOrder.warranty_status}
                                                onChange={(e) => updateOrderStatus(selectedOrder.order_id, e.target.value)}
                                                disabled={isUpdatingStatus}
                                                className="px-2 py-1 text-xs border rounded-lg bg-background hover:bg-accent disabled:opacity-50 cursor-pointer"
                                            >
                                                <option value="PENDING">Set Pending</option>
                                                <option value="APPROVED">Set Approved</option>
                                                <option value="REJECTED">Set Rejected</option>
                                                <option value="BLOCKED">Set Blocked</option>
                                            </select>
                                            {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">GetCID Usage</p>
                                        <div className="mt-1">
                                            {(() => {
                                                const isCombo = selectedOrder.fsn ? isComboProduct(selectedOrder.fsn) : false;
                                                const qty = selectedOrder.quantity || 1;
                                                const itemsPerOrder = isCombo ? 2 : 1;
                                                const maxUses = qty * itemsPerOrder;
                                                const usedCount = selectedOrder.getcid_count || 0;
                                                const remaining = maxUses - usedCount;

                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            <span className={`font-bold ${usedCount >= maxUses ? 'text-red-600' : 'text-green-600'}`}>
                                                                {usedCount}
                                                            </span>
                                                            <span className="text-muted-foreground">/</span>
                                                            <span className="font-medium">{maxUses}</span>
                                                        </div>
                                                        {usedCount >= maxUses ? (
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Exhausted
                                                            </span>
                                                        ) : usedCount > 0 ? (
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                {remaining} left
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                Not Used
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
