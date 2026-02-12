'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Search, Plus, Pencil, Trash2, Save, X, Loader2, RefreshCw,
    Package, Link2, Image as ImageIcon, FileText, Copy, Check, ExternalLink
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

    // ─── Fetch Products ────────────────────────────────────────────

    const fetchProducts = useCallback(async () => {
        setProductsLoading(true);
        const { data, error } = await supabase
            .from('products_data')
            .select('*')
            .order('product_title', { ascending: true });

        if (error) {
            toast.error('Failed to load products');
            console.error(error);
        } else {
            setProducts(data || []);
        }
        setProductsLoading(false);
    }, [supabase]);

    // ─── Fetch ASIN Mappings ───────────────────────────────────────

    const fetchMappings = useCallback(async () => {
        setMappingsLoading(true);
        const { data, error } = await supabase
            .from('amazon_asin_mapping')
            .select('*')
            .order('fsn', { ascending: true });

        if (error) {
            toast.error('Failed to load ASIN mappings');
            console.error(error);
        } else {
            setMappings(data || []);
        }
        setMappingsLoading(false);
    }, [supabase]);

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
        const { data, error } = await supabase
            .from('products_data')
            .insert({
                fsn: newProduct.fsn.trim(),
                product_title: newProduct.product_title.trim(),
                download_link: newProduct.download_link?.trim() || null,
                product_image: newProduct.product_image?.trim() || null,
                installation_doc: newProduct.installation_doc?.trim() || null,
            })
            .select()
            .single();

        if (error) {
            toast.error(error.message || 'Failed to add product');
        } else {
            toast.success('Product added');
            setProducts(prev => [...prev, data]);
            setShowAddProduct(false);
            setNewProduct({ fsn: '', product_title: '', download_link: '', product_image: '', installation_doc: '' });
        }
        setSavingProduct(false);
    };

    const handleSaveProduct = async (id: string) => {
        setSavingProduct(true);
        const { error } = await supabase
            .from('products_data')
            .update({
                fsn: editForm.fsn,
                product_title: editForm.product_title,
                download_link: editForm.download_link || null,
                product_image: editForm.product_image || null,
                installation_doc: editForm.installation_doc || null,
            })
            .eq('id', id);

        if (error) {
            toast.error(error.message || 'Failed to update product');
        } else {
            toast.success('Product updated');
            setProducts(prev => prev.map(p => p.id === id ? { ...p, ...editForm } as ProductData : p));
            setEditingProduct(null);
        }
        setSavingProduct(false);
    };

    const handleDeleteProduct = async (product: ProductData) => {
        if (!confirm(`Delete product "${product.product_title}" (${product.fsn})?`)) return;
        const { error } = await supabase.from('products_data').delete().eq('id', product.id);
        if (error) {
            toast.error('Failed to delete product');
        } else {
            toast.success('Product deleted');
            setProducts(prev => prev.filter(p => p.id !== product.id));
        }
    };

    // ─── ASIN Mapping CRUD ─────────────────────────────────────────

    const handleAddMapping = async () => {
        if (!newMapping.asin?.trim() || !newMapping.fsn?.trim()) {
            toast.error('ASIN and FSN are required');
            return;
        }
        setSavingMapping(true);
        const { data, error } = await supabase
            .from('amazon_asin_mapping')
            .insert({
                asin: newMapping.asin.trim(),
                fsn: newMapping.fsn.trim(),
                product_title: newMapping.product_title?.trim() || null,
            })
            .select()
            .single();

        if (error) {
            toast.error(error.message || 'Failed to add mapping');
        } else {
            toast.success('ASIN mapping added');
            setMappings(prev => [...prev, data]);
            setShowAddMapping(false);
            setNewMapping({ asin: '', fsn: '', product_title: '' });
        }
        setSavingMapping(false);
    };

    const handleSaveMapping = async (id: string) => {
        setSavingMapping(true);
        const { error } = await supabase
            .from('amazon_asin_mapping')
            .update({
                asin: editMappingForm.asin,
                fsn: editMappingForm.fsn,
                product_title: editMappingForm.product_title || null,
            })
            .eq('id', id);

        if (error) {
            toast.error(error.message || 'Failed to update mapping');
        } else {
            toast.success('Mapping updated');
            setMappings(prev => prev.map(m => m.id === id ? { ...m, ...editMappingForm } as AsinMapping : m));
            setEditingMapping(null);
        }
        setSavingMapping(false);
    };

    const handleDeleteMapping = async (mapping: AsinMapping) => {
        if (!confirm(`Delete ASIN mapping "${mapping.asin}" → ${mapping.fsn}?`)) return;
        const { error } = await supabase.from('amazon_asin_mapping').delete().eq('id', mapping.id);
        if (error) {
            toast.error('Failed to delete mapping');
        } else {
            toast.success('Mapping deleted');
            setMappings(prev => prev.filter(m => m.id !== mapping.id));
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
                                    <label className="text-xs font-medium text-muted-foreground">Product Image URL</label>
                                    <input value={newProduct.product_image || ''} onChange={e => setNewProduct({ ...newProduct, product_image: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="https://..." />
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
                                                            <td className="px-4 py-2"><input value={editForm.product_image || ''} onChange={e => setEditForm({ ...editForm, product_image: e.target.value })} className="w-full px-2 py-1.5 rounded border bg-background text-sm" /></td>
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
                                                            <td className="px-4 py-3 text-sm">
                                                                {product.product_image ? (
                                                                    <a href={product.product_image} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                                                                        <ImageIcon className="h-3 w-3 shrink-0" /> View
                                                                    </a>
                                                                ) : <span className="text-muted-foreground text-xs">—</span>}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {product.installation_doc ? (
                                                                    <span className="px-2 py-1 rounded text-xs font-mono bg-muted text-muted-foreground">{product.installation_doc}</span>
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
                                                <div className="min-w-0">
                                                    <code className="text-sm font-mono font-bold">{product.fsn}</code>
                                                    <p className="text-sm text-muted-foreground truncate">{product.product_title}</p>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button onClick={() => { setEditingProduct(product.id); setEditForm(product); }} className="w-8 h-8 inline-flex items-center justify-center rounded text-blue-600 bg-blue-50 dark:bg-blue-900/20"><Pencil className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDeleteProduct(product)} className="w-8 h-8 inline-flex items-center justify-center rounded text-red-600 bg-red-50 dark:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {product.download_link && <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">Has Download</span>}
                                                {product.product_image && <span className="px-2 py-1 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">Has Image</span>}
                                                {product.installation_doc && <span className="px-2 py-1 rounded bg-muted font-mono">{product.installation_doc}</span>}
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
                                    <input value={newMapping.fsn || ''} onChange={e => setNewMapping({ ...newMapping, fsn: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono" placeholder="e.g. 365E5" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Product Title</label>
                                    <input value={newMapping.product_title || ''} onChange={e => setNewMapping({ ...newMapping, product_title: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="e.g. Microsoft 365 E5" />
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
