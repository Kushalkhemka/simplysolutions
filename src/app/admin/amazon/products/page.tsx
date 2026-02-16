'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Search, Plus, Pencil, Trash2, Save, X, Loader2, RefreshCw,
    Package, Link2, Image as ImageIcon, FileText, Copy, Check, ExternalLink, Upload,
    ArrowRightLeft, CheckSquare, Square
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────

interface ProductData {
    id: string;
    fsn: string;
    product_title: string;
    download_link: string | null;
    product_image: string | null;
    installation_doc: string | null;
}

interface AsinMapping {
    id: string;
    asin: string;
    fsn: string;
    product_title: string | null;
}

interface OrderSearchResult {
    order_id: string;
    fsn: string | null;
    order_date: string | null;
    buyer_email: string | null;
    fulfillment_type: string | null;
}

type Tab = 'products' | 'asin';

// ─── Component ─────────────────────────────────────────────────────

export default function ProductManagementPage() {
    const supabase = createClient();

    const [activeTab, setActiveTab] = useState<Tab>('products');

    // -- Products state --
    const [products, setProducts] = useState<ProductData[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productSearch, setProductSearch] = useState('');
    const [editingProduct, setEditingProduct] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ProductData>>({});
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newProduct, setNewProduct] = useState<Partial<ProductData>>({ fsn: '', product_title: '', download_link: '', product_image: '', installation_doc: '' });
    const [savingProduct, setSavingProduct] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // -- ASIN Mappings state --
    const [mappings, setMappings] = useState<AsinMapping[]>([]);
    const [mappingsLoading, setMappingsLoading] = useState(true);
    const [mappingSearch, setMappingSearch] = useState('');
    const [editingMapping, setEditingMapping] = useState<string | null>(null);
    const [editMappingForm, setEditMappingForm] = useState<Partial<AsinMapping>>({});
    const [showAddMapping, setShowAddMapping] = useState(false);
    const [newMapping, setNewMapping] = useState<Partial<AsinMapping>>({ asin: '', fsn: '', product_title: '' });
    const [savingMapping, setSavingMapping] = useState(false);

    const [copied, setCopied] = useState<string | null>(null);

    // -- Order Remap state --
    const [showRemapOrders, setShowRemapOrders] = useState(false);
    const [remapFsn, setRemapFsn] = useState('');
    const [orderSearch, setOrderSearch] = useState('');
    const [orderResults, setOrderResults] = useState<OrderSearchResult[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [searchingOrders, setSearchingOrders] = useState(false);
    const [remappingOrders, setRemappingOrders] = useState(false);

    // ─── Image Upload ──────────────────────────────────────────────

    const handleImageUpload = async (file: File, target: 'new' | 'edit') => {
        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/upload-product-image', {
                method: 'POST',
                body: formData,
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                toast.error('Upload failed: ' + (result.error || 'Unknown error'));
                return;
            }

            const publicUrl = result.data.url;
            if (target === 'new') {
                setNewProduct(prev => ({ ...prev, product_image: publicUrl }));
            } else {
                setEditForm(prev => ({ ...prev, product_image: publicUrl }));
            }
            toast.success('Image uploaded');
        } catch (err: any) {
            toast.error('Upload error: ' + (err.message || 'Unknown'));
        } finally {
            setUploadingImage(false);
        }
    };

    // ─── Fetch Products ────────────────────────────────────────────

    const fetchProducts = useCallback(async () => {
        setProductsLoading(true);
        try {
            const res = await fetch('/api/admin/products-data');
            const result = await res.json();
            if (!res.ok || !result.success) {
                toast.error('Failed to load products');
            } else {
                setProducts(result.data || []);
            }
        } catch {
            toast.error('Failed to load products');
        }
        setProductsLoading(false);
    }, []);

    // ─── Fetch ASIN Mappings ───────────────────────────────────────

    const fetchMappings = useCallback(async () => {
        setMappingsLoading(true);
        try {
            const res = await fetch('/api/admin/asin-mappings');
            const result = await res.json();
            if (!res.ok || !result.success) {
                toast.error('Failed to load ASIN mappings');
            } else {
                setMappings(result.data || []);
            }
        } catch {
            toast.error('Failed to load ASIN mappings');
        }
        setMappingsLoading(false);
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchMappings();
    }, [fetchProducts, fetchMappings]);

    // ─── Product CRUD ──────────────────────────────────────────────

    const handleAddProduct = async () => {
        if (!newProduct.fsn?.trim() || !newProduct.product_title?.trim()) {
            toast.error('FSN and Product Title are required');
            return;
        }
        setSavingProduct(true);
        try {
            const res = await fetch('/api/admin/products-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fsn: newProduct.fsn.trim(),
                    product_title: newProduct.product_title.trim(),
                    download_link: newProduct.download_link?.trim() || null,
                    product_image: newProduct.product_image?.trim() || null,
                    installation_doc: newProduct.installation_doc?.trim() || null,
                }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                toast.error(result.error || 'Failed to add product');
            } else {
                toast.success('Product added');
                setProducts(prev => [...prev, result.data]);
                setShowAddProduct(false);
                setNewProduct({ fsn: '', product_title: '', download_link: '', product_image: '', installation_doc: '' });
            }
        } catch {
            toast.error('Failed to add product');
        }
        setSavingProduct(false);
    };

    const handleSaveProduct = async (id: string) => {
        setSavingProduct(true);
        try {
            const res = await fetch('/api/admin/products-data', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    fsn: editForm.fsn,
                    product_title: editForm.product_title,
                    download_link: editForm.download_link || null,
                    product_image: editForm.product_image || null,
                    installation_doc: editForm.installation_doc || null,
                }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                toast.error(result.error || 'Failed to update product');
            } else {
                toast.success('Product updated');
                setProducts(prev => prev.map(p => p.id === id ? { ...p, ...editForm } as ProductData : p));
                setEditingProduct(null);
            }
        } catch {
            toast.error('Failed to update product');
        }
        setSavingProduct(false);
    };

    const handleDeleteProduct = async (product: ProductData) => {
        if (!confirm(`Delete product "${product.product_title}" (${product.fsn})?`)) return;
        try {
            const res = await fetch(`/api/admin/products-data?id=${product.id}`, { method: 'DELETE' });
            const result = await res.json();
            if (!res.ok || !result.success) {
                toast.error('Failed to delete product');
            } else {
                toast.success('Product deleted');
                setProducts(prev => prev.filter(p => p.id !== product.id));
            }
        } catch {
            toast.error('Failed to delete product');
        }
    };

    // ─── ASIN Mapping CRUD ─────────────────────────────────────────

    // Auto-resolve product title from products state when FSN changes
    const resolveProductTitle = (fsn: string) => {
        const match = products.find(p => p.fsn.toLowerCase() === fsn.trim().toLowerCase());
        return match?.product_title || '';
    };

    const handleMappingFsnChange = (fsn: string) => {
        const title = resolveProductTitle(fsn);
        setNewMapping(prev => ({ ...prev, fsn, product_title: title }));
    };

    const handleAddMapping = async () => {
        if (!newMapping.asin?.trim() || !newMapping.fsn?.trim()) {
            toast.error('ASIN and FSN are required');
            return;
        }
        setSavingMapping(true);
        try {
            const res = await fetch('/api/admin/asin-mappings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asin: newMapping.asin.trim(),
                    fsn: newMapping.fsn.trim(),
                    product_title: newMapping.product_title?.trim() || null,
                }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                toast.error(result.error || 'Failed to add mapping');
            } else {
                toast.success('ASIN mapping added');
                setMappings(prev => [...prev, result.data]);
                setShowAddMapping(false);
                setNewMapping({ asin: '', fsn: '', product_title: '' });
            }
        } catch {
            toast.error('Failed to add mapping');
        }
        setSavingMapping(false);
    };

    const handleSaveMapping = async (id: string) => {
        setSavingMapping(true);
        try {
            const res = await fetch('/api/admin/asin-mappings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    asin: editMappingForm.asin,
                    fsn: editMappingForm.fsn,
                    product_title: editMappingForm.product_title || null,
                }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                toast.error(result.error || 'Failed to update mapping');
            } else {
                toast.success('Mapping updated');
                setMappings(prev => prev.map(m => m.id === id ? { ...m, ...editMappingForm } as AsinMapping : m));
                setEditingMapping(null);
            }
        } catch {
            toast.error('Failed to update mapping');
        }
        setSavingMapping(false);
    };

    const handleDeleteMapping = async (mapping: AsinMapping) => {
        if (!confirm(`Delete ASIN mapping "${mapping.asin}" → ${mapping.fsn}?`)) return;
        try {
            const res = await fetch(`/api/admin/asin-mappings?id=${mapping.id}`, { method: 'DELETE' });
            const result = await res.json();
            if (!res.ok || !result.success) {
                toast.error('Failed to delete mapping');
            } else {
                toast.success('Mapping deleted');
                setMappings(prev => prev.filter(m => m.id !== mapping.id));
            }
        } catch {
            toast.error('Failed to delete mapping');
        }
    };

    // ─── Order Remap ───────────────────────────────────────────────

    const searchOrders = async () => {
        if (!orderSearch.trim() || orderSearch.trim().length < 2) {
            toast.error('Enter at least 2 characters to search');
            return;
        }
        setSearchingOrders(true);
        try {
            const res = await fetch(`/api/admin/products/remap-orders?search=${encodeURIComponent(orderSearch.trim())}`);
            const result = await res.json();
            if (!res.ok || !result.success) {
                toast.error(result.error || 'Search failed');
                return;
            }
            setOrderResults(result.data);
            setSelectedOrderIds(new Set());
        } catch {
            toast.error('Failed to search orders');
        } finally {
            setSearchingOrders(false);
        }
    };

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrderIds(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };

    const selectAllOrders = () => {
        if (selectedOrderIds.size === orderResults.length) {
            setSelectedOrderIds(new Set());
        } else {
            setSelectedOrderIds(new Set(orderResults.map(o => o.order_id)));
        }
    };

    const handleRemapOrders = async () => {
        if (!remapFsn.trim()) {
            toast.error('Enter the target FSN');
            return;
        }
        if (selectedOrderIds.size === 0) {
            toast.error('Select at least one order');
            return;
        }
        setRemappingOrders(true);
        try {
            const res = await fetch('/api/admin/products/remap-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fsn: remapFsn.trim(), orderIds: Array.from(selectedOrderIds) }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) {
                toast.error(result.error || 'Remap failed');
                return;
            }
            toast.success(`${result.data.updatedCount} order(s) remapped to FSN: ${remapFsn.trim()}`);
            // Refresh search results to show updated FSN
            setOrderResults(prev => prev.map(o => selectedOrderIds.has(o.order_id) ? { ...o, fsn: remapFsn.trim() } : o));
            setSelectedOrderIds(new Set());
        } catch {
            toast.error('Failed to remap orders');
        } finally {
            setRemappingOrders(false);
        }
    };

    // ─── Helpers ────────────────────────────────────────────────────

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 1500);
    };

    const filteredProducts = products.filter(p =>
        p.fsn.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.product_title.toLowerCase().includes(productSearch.toLowerCase())
    );

    const filteredMappings = mappings.filter(m =>
        m.asin.toLowerCase().includes(mappingSearch.toLowerCase()) ||
        m.fsn.toLowerCase().includes(mappingSearch.toLowerCase()) ||
        (m.product_title || '').toLowerCase().includes(mappingSearch.toLowerCase())
    );

    // ─── Render ────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Product & ASIN Management</h1>
                <p className="text-muted-foreground">Manage products data and ASIN → FSN mappings</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Package className="h-4 w-4 inline mr-2" />
                    Products ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('asin')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'asin' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Link2 className="h-4 w-4 inline mr-2" />
                    ASIN Mappings ({mappings.length})
                </button>
            </div>

            {/* ═══════════════════ PRODUCTS TAB ═══════════════════ */}
            {activeTab === 'products' && (
                <div className="space-y-4">
                    {/* Search + Add */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                                placeholder="Search by FSN or product name..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <button onClick={fetchProducts} disabled={productsLoading} className="flex items-center gap-2 px-3 py-2.5 border rounded-lg hover:bg-accent disabled:opacity-50 text-sm">
                            <RefreshCw className={`h-4 w-4 ${productsLoading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        <button
                            onClick={() => setShowAddProduct(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium"
                        >
                            <Plus className="h-4 w-4" /> Add Product
                        </button>
                    </div>

                    {/* Add Product Form */}
                    {showAddProduct && (
                        <div className="bg-card border rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> New Product</h3>
                                <button onClick={() => setShowAddProduct(false)} className="p-1 hover:bg-muted rounded"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">FSN *</label>
                                    <input value={newProduct.fsn || ''} onChange={e => setNewProduct({ ...newProduct, fsn: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono" placeholder="e.g. WINDOWS11" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Product Title *</label>
                                    <input value={newProduct.product_title || ''} onChange={e => setNewProduct({ ...newProduct, product_title: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="e.g. Windows 11 Pro" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Download Link</label>
                                    <input value={newProduct.download_link || ''} onChange={e => setNewProduct({ ...newProduct, download_link: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="https://..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Product Image</label>
                                    <div className="flex items-center gap-2">
                                        <input value={newProduct.product_image || ''} onChange={e => setNewProduct({ ...newProduct, product_image: e.target.value })} className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Paste URL or upload →" />
                                        <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer hover:bg-accent transition-colors ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                            {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                            Upload
                                            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'new'); e.target.value = ''; }} />
                                        </label>
                                    </div>
                                    {newProduct.product_image && (
                                        <img src={newProduct.product_image} alt="Preview" className="mt-1 w-12 h-12 rounded object-cover border" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Installation Doc Slug</label>
                                    <input value={newProduct.installation_doc || ''} onChange={e => setNewProduct({ ...newProduct, installation_doc: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="e.g. win10_11pro" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setShowAddProduct(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-accent">Cancel</button>
                                <button onClick={handleAddProduct} disabled={savingProduct} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                                    {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Product
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Remap Orders to FSN ────────────────── */}
                    <div className="bg-card border rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <ArrowRightLeft className="h-5 w-5 text-primary" />
                                Remap Orders to FSN
                            </h3>
                            <button onClick={() => setShowRemapOrders(!showRemapOrders)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent">
                                {showRemapOrders ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">Map existing Amazon orders (that fell back to SKU) to the correct FSN.</p>

                        {showRemapOrders && (
                            <div className="space-y-4">
                                {/* Target FSN */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Target FSN *</label>
                                    <input
                                        value={remapFsn}
                                        onChange={e => setRemapFsn(e.target.value)}
                                        className="w-full md:w-1/2 px-3 py-2 rounded-lg border bg-background text-sm font-mono"
                                        placeholder="e.g. OFFICE2024"
                                    />
                                </div>

                                {/* Search Orders */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Search Orders (by Order ID or current FSN/SKU)</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                value={orderSearch}
                                                onChange={e => setOrderSearch(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && searchOrders()}
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm"
                                                placeholder="e.g. OFF_O2024 or 408-123..."
                                            />
                                        </div>
                                        <button
                                            onClick={searchOrders}
                                            disabled={searchingOrders}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                        >
                                            {searchingOrders ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                            Search
                                        </button>
                                    </div>
                                </div>

                                {/* Results */}
                                {orderResults.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">{orderResults.length} order(s) found · {selectedOrderIds.size} selected</p>
                                            <button onClick={selectAllOrders} className="text-xs text-primary hover:underline">
                                                {selectedOrderIds.size === orderResults.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                        <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50 border-b sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left w-8">
                                                            <button onClick={selectAllOrders} className="opacity-70 hover:opacity-100">
                                                                {selectedOrderIds.size === orderResults.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                                            </button>
                                                        </th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Order ID</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Current FSN</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Date</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Email</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {orderResults.map(order => (
                                                        <tr
                                                            key={order.order_id}
                                                            onClick={() => toggleOrderSelection(order.order_id)}
                                                            className={`cursor-pointer transition-colors ${selectedOrderIds.has(order.order_id) ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                                        >
                                                            <td className="px-3 py-2">
                                                                {selectedOrderIds.has(order.order_id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                                                            </td>
                                                            <td className="px-3 py-2 font-mono text-xs">{order.order_id}</td>
                                                            <td className="px-3 py-2">
                                                                <span className="px-2 py-0.5 rounded text-xs font-mono bg-muted">{order.fsn || '—'}</span>
                                                            </td>
                                                            <td className="px-3 py-2 text-xs text-muted-foreground">
                                                                {order.order_date ? new Date(order.order_date).toLocaleDateString() : '—'}
                                                            </td>
                                                            <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[160px]">{order.buyer_email || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Remap Button */}
                                        <div className="flex items-center gap-3 pt-1">
                                            <button
                                                onClick={handleRemapOrders}
                                                disabled={remappingOrders || selectedOrderIds.size === 0 || !remapFsn.trim()}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                            >
                                                {remappingOrders ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                                                Remap {selectedOrderIds.size} Order(s) → {remapFsn || '...'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Products Table */}
                    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                        {productsLoading ? (
                            <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /><p className="mt-2 text-muted-foreground">Loading products...</p></div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">FSN</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Title</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Download</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Install Doc</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredProducts.map(product => (
                                                <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                                                    {editingProduct === product.id ? (
                                                        <>
                                                            <td className="px-4 py-2"><input value={editForm.fsn || ''} onChange={e => setEditForm({ ...editForm, fsn: e.target.value })} className="w-full px-2 py-1.5 rounded border bg-background text-sm font-mono" /></td>
                                                            <td className="px-4 py-2"><input value={editForm.product_title || ''} onChange={e => setEditForm({ ...editForm, product_title: e.target.value })} className="w-full px-2 py-1.5 rounded border bg-background text-sm" /></td>
                                                            <td className="px-4 py-2"><input value={editForm.download_link || ''} onChange={e => setEditForm({ ...editForm, download_link: e.target.value })} className="w-full px-2 py-1.5 rounded border bg-background text-sm" /></td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center gap-1">
                                                                    <input value={editForm.product_image || ''} onChange={e => setEditForm({ ...editForm, product_image: e.target.value })} className="flex-1 px-2 py-1.5 rounded border bg-background text-sm min-w-0" />
                                                                    <label className={`shrink-0 w-8 h-8 inline-flex items-center justify-center rounded border cursor-pointer hover:bg-accent ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`} title="Upload image">
                                                                        {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                                                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'edit'); e.target.value = ''; }} />
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2"><input value={editForm.installation_doc || ''} onChange={e => setEditForm({ ...editForm, installation_doc: e.target.value })} className="w-full px-2 py-1.5 rounded border bg-background text-sm" /></td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button onClick={() => handleSaveProduct(product.id)} disabled={savingProduct} className="w-8 h-8 inline-flex items-center justify-center rounded text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 disabled:opacity-50" title="Save">
                                                                        {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                                    </button>
                                                                    <button onClick={() => setEditingProduct(null)} className="w-8 h-8 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted" title="Cancel"><X className="h-4 w-4" /></button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <code className="text-sm font-mono font-medium">{product.fsn}</code>
                                                                    <button onClick={() => handleCopy(product.fsn)} className="opacity-50 hover:opacity-100" title="Copy FSN">
                                                                        {copied === product.fsn ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">{product.product_title}</td>
                                                            <td className="px-4 py-3 text-sm">
                                                                {product.download_link ? (
                                                                    <a href={product.download_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs truncate max-w-[180px]">
                                                                        <ExternalLink className="h-3 w-3 shrink-0" /> Link
                                                                    </a>
                                                                ) : <span className="text-muted-foreground text-xs">—</span>}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {product.product_image ? (
                                                                    <a href={product.product_image} target="_blank" rel="noopener noreferrer" className="block" title="Click to view full size">
                                                                        <img src={product.product_image} alt={product.product_title} className="w-9 h-9 rounded object-cover border border-border hover:ring-2 hover:ring-primary transition-all" />
                                                                    </a>
                                                                ) : <span className="text-muted-foreground text-xs">—</span>}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {product.installation_doc ? (
                                                                    <a href={`/installation-docs/${product.installation_doc.replace(/\.md$/i, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:underline">
                                                                        <FileText className="h-3 w-3" /> {product.installation_doc}
                                                                    </a>
                                                                ) : <span className="text-muted-foreground text-xs">—</span>}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button onClick={() => { setEditingProduct(product.id); setEditForm(product); }} className="w-8 h-8 inline-flex items-center justify-center rounded text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 transition-colors" title="Edit">
                                                                        <Pencil className="h-4 w-4" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteProduct(product)} className="w-8 h-8 inline-flex items-center justify-center rounded text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition-colors" title="Delete">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="lg:hidden divide-y">
                                    {filteredProducts.map(product => (
                                        <div key={product.id} className="p-4 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {product.product_image ? (
                                                        <img src={product.product_image} alt={product.product_title} className="w-10 h-10 rounded object-cover border border-border shrink-0" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <code className="text-sm font-mono font-bold">{product.fsn}</code>
                                                        <p className="text-sm text-muted-foreground truncate">{product.product_title}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button onClick={() => { setEditingProduct(product.id); setEditForm(product); }} className="w-8 h-8 inline-flex items-center justify-center rounded text-blue-600 bg-blue-50 dark:bg-blue-900/20"><Pencil className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDeleteProduct(product)} className="w-8 h-8 inline-flex items-center justify-center rounded text-red-600 bg-red-50 dark:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {product.download_link && <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">Has Download</span>}
                                                {product.installation_doc && (
                                                    <a href={`/installation-docs/${product.installation_doc.replace(/\.md$/i, '')}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-mono hover:underline flex items-center gap-1">
                                                        <FileText className="h-3 w-3" /> {product.installation_doc}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredProducts.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        {productSearch ? 'No products match your search' : 'No products found'}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">Showing {filteredProducts.length} of {products.length} products</p>
                </div>
            )}

            {/* ═══════════════════ ASIN MAPPINGS TAB ═══════════════════ */}
            {activeTab === 'asin' && (
                <div className="space-y-4">
                    {/* Search + Add */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={mappingSearch}
                                onChange={e => setMappingSearch(e.target.value)}
                                placeholder="Search by ASIN, FSN, or title..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <button onClick={fetchMappings} disabled={mappingsLoading} className="flex items-center gap-2 px-3 py-2.5 border rounded-lg hover:bg-accent disabled:opacity-50 text-sm">
                            <RefreshCw className={`h-4 w-4 ${mappingsLoading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        <button
                            onClick={() => setShowAddMapping(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium"
                        >
                            <Plus className="h-4 w-4" /> Add Mapping
                        </button>
                    </div>

                    {/* Add Mapping Form */}
                    {showAddMapping && (
                        <div className="bg-card border rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> New ASIN Mapping</h3>
                                <button onClick={() => setShowAddMapping(false)} className="p-1 hover:bg-muted rounded"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">ASIN *</label>
                                    <input value={newMapping.asin || ''} onChange={e => setNewMapping({ ...newMapping, asin: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono" placeholder="e.g. B0GM2TFCQD" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">FSN *</label>
                                    <input value={newMapping.fsn || ''} onChange={e => handleMappingFsnChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono" placeholder="e.g. 365E5" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Product Title <span className="text-muted-foreground/60">(auto-filled)</span></label>
                                    <input value={newMapping.product_title || ''} onChange={e => setNewMapping({ ...newMapping, product_title: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Auto-filled from FSN" readOnly={!!newMapping.product_title && !!resolveProductTitle(newMapping.fsn || '')} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setShowAddMapping(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-accent">Cancel</button>
                                <button onClick={handleAddMapping} disabled={savingMapping} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                                    {savingMapping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Mapping
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ASIN Mappings Table */}
                    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                        {mappingsLoading ? (
                            <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /><p className="mt-2 text-muted-foreground">Loading mappings...</p></div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ASIN</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">FSN</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Title</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amazon Link</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredMappings.map(mapping => (
                                                <tr key={mapping.id} className="hover:bg-muted/50 transition-colors">
                                                    {editingMapping === mapping.id ? (
                                                        <>
                                                            <td className="px-4 py-2"><input value={editMappingForm.asin || ''} onChange={e => setEditMappingForm({ ...editMappingForm, asin: e.target.value })} className="w-full px-2 py-1.5 rounded border bg-background text-sm font-mono" /></td>
                                                            <td className="px-4 py-2"><input value={editMappingForm.fsn || ''} onChange={e => setEditMappingForm({ ...editMappingForm, fsn: e.target.value })} className="w-full px-2 py-1.5 rounded border bg-background text-sm font-mono" /></td>
                                                            <td className="px-4 py-2"><input value={editMappingForm.product_title || ''} onChange={e => setEditMappingForm({ ...editMappingForm, product_title: e.target.value })} className="w-full px-2 py-1.5 rounded border bg-background text-sm" /></td>
                                                            <td className="px-4 py-2">—</td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button onClick={() => handleSaveMapping(mapping.id)} disabled={savingMapping} className="w-8 h-8 inline-flex items-center justify-center rounded text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 disabled:opacity-50" title="Save">
                                                                        {savingMapping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                                    </button>
                                                                    <button onClick={() => setEditingMapping(null)} className="w-8 h-8 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted" title="Cancel"><X className="h-4 w-4" /></button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <code className="text-sm font-mono font-medium">{mapping.asin}</code>
                                                                    <button onClick={() => handleCopy(mapping.asin)} className="opacity-50 hover:opacity-100" title="Copy ASIN">
                                                                        {copied === mapping.asin ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-1 rounded text-xs font-mono bg-muted">{mapping.fsn}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-muted-foreground">{mapping.product_title || '—'}</td>
                                                            <td className="px-4 py-3">
                                                                <a href={`https://www.amazon.in/dp/${mapping.asin}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                                                                    <ExternalLink className="h-3 w-3" /> amazon.in
                                                                </a>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button onClick={() => { setEditingMapping(mapping.id); setEditMappingForm(mapping); }} className="w-8 h-8 inline-flex items-center justify-center rounded text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 transition-colors" title="Edit">
                                                                        <Pencil className="h-4 w-4" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteMapping(mapping)} className="w-8 h-8 inline-flex items-center justify-center rounded text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition-colors" title="Delete">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="lg:hidden divide-y">
                                    {filteredMappings.map(mapping => (
                                        <div key={mapping.id} className="p-4 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-sm font-mono font-bold">{mapping.asin}</code>
                                                        <span className="text-muted-foreground">→</span>
                                                        <span className="px-2 py-0.5 rounded text-xs font-mono bg-muted">{mapping.fsn}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate mt-1">{mapping.product_title || '—'}</p>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button onClick={() => { setEditingMapping(mapping.id); setEditMappingForm(mapping); }} className="w-8 h-8 inline-flex items-center justify-center rounded text-blue-600 bg-blue-50 dark:bg-blue-900/20"><Pencil className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDeleteMapping(mapping)} className="w-8 h-8 inline-flex items-center justify-center rounded text-red-600 bg-red-50 dark:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredMappings.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        {mappingSearch ? 'No mappings match your search' : 'No ASIN mappings found'}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">Showing {filteredMappings.length} of {mappings.length} mappings</p>
                </div>
            )}
        </div>
    );
}
