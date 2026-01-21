'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Key, Hash, Loader2, CheckCircle, AlertCircle, Upload, X } from 'lucide-react';

interface FsnMapping {
    fsn: string;
    product_title: string;
}

interface AvailableKey {
    id: string;
    license_key: string;
}

export default function ManualOrderClient() {
    const [fsnMappings, setFsnMappings] = useState<FsnMapping[]>([]);
    const [availableKeys, setAvailableKeys] = useState<AvailableKey[]>([]);

    // Form state
    const [orderId, setOrderId] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [selectedFsn, setSelectedFsn] = useState('');
    const [selectedKeyId, setSelectedKeyId] = useState('');
    const [productName, setProductName] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // CSV upload state
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvUploading, setCsvUploading] = useState(false);
    const [csvProgress, setCsvProgress] = useState('');

    const supabase = createClient();

    // Fetch FSN mappings
    useEffect(() => {
        const fetchMappings = async () => {
            const { data } = await supabase
                .from('products_data')
                .select('fsn, product_title')
                .order('fsn');

            if (data) {
                setFsnMappings(data);
            }
        };
        fetchMappings();
    }, [supabase]);

    // Fetch available keys when FSN changes
    useEffect(() => {
        const fetchKeys = async () => {
            if (!selectedFsn) {
                setAvailableKeys([]);
                return;
            }

            const { data } = await supabase
                .from('amazon_activation_license_keys')
                .select('id, license_key')
                .eq('fsn', selectedFsn)
                .eq('is_redeemed', false)
                .limit(100);

            setAvailableKeys(data || []);
        };
        fetchKeys();
    }, [selectedFsn, supabase]);

    // Update product name when FSN changes
    const handleFsnChange = (fsn: string) => {
        setSelectedFsn(fsn);
        setSelectedKeyId('');
        const mapping = fsnMappings.find(m => m.fsn === fsn);
        setProductName(mapping?.product_title || '');
    };

    // Validate Order ID format (Amazon format: XXX-XXXXXXX-XXXXXXX)
    const validateOrderId = (id: string) => {
        const amazonPattern = /^\d{3}-\d{7}-\d{7}$/;
        return amazonPattern.test(id);
    };

    // Validate Secret Code (15 digits)
    const validateSecretCode = (code: string) => {
        return /^\d{15}$/.test(code);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validate inputs
        if (!orderId && !secretCode) {
            setMessage({ type: 'error', text: 'Please enter either Order ID or Secret Code' });
            return;
        }

        if (orderId && !validateOrderId(orderId)) {
            setMessage({ type: 'error', text: 'Invalid Order ID format. Expected: XXX-XXXXXXX-XXXXXXX' });
            return;
        }

        if (secretCode && !validateSecretCode(secretCode)) {
            setMessage({ type: 'error', text: 'Invalid Secret Code. Must be exactly 15 digits.' });
            return;
        }

        if (!selectedFsn) {
            setMessage({ type: 'error', text: 'Please select a product FSN' });
            return;
        }

        setIsSubmitting(true);

        try {
            // Check if order already exists
            const identifier = orderId || secretCode;
            const { data: existing } = await supabase
                .from('amazon_orders')
                .select('id')
                .eq('order_id', identifier)
                .single();

            if (existing) {
                setMessage({ type: 'error', text: 'Order already exists in the system' });
                setIsSubmitting(false);
                return;
            }

            // Create the order
            const orderData: any = {
                order_id: identifier,
                fsn: selectedFsn,
                fulfillment_type: secretCode ? 'amazon_digital' : 'amazon_fba',
                warranty_status: 'PENDING',
            };

            // If a key is selected, link it
            if (selectedKeyId) {
                orderData.license_key_id = selectedKeyId;

                // Mark the key as redeemed
                await supabase
                    .from('amazon_activation_license_keys')
                    .update({
                        is_redeemed: true,
                        order_id: identifier,
                    })
                    .eq('id', selectedKeyId);
            }

            const { error } = await supabase
                .from('amazon_orders')
                .insert(orderData);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Order created successfully!' });

            // Reset form
            setOrderId('');
            setSecretCode('');
            setSelectedFsn('');
            setSelectedKeyId('');
            setProductName('');

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to create order' });
        }

        setIsSubmitting(false);
    };

    // Handle CSV upload
    const handleCsvUpload = async () => {
        if (!csvFile) return;

        setCsvUploading(true);
        setCsvProgress('Reading file...');

        try {
            const text = await csvFile.text();
            const lines = text.split('\n').filter(l => l.trim());

            // Skip header
            const dataLines = lines.slice(1);
            setCsvProgress(`Processing ${dataLines.length} orders...`);

            let imported = 0;
            let skipped = 0;
            let errors = 0;

            for (const line of dataLines) {
                const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));

                // Expected format: Order ID, FSN, License Key (optional)
                if (parts.length < 2) {
                    skipped++;
                    continue;
                }

                const [orderIdVal, fsnVal, keyVal] = parts;

                if (!orderIdVal || !fsnVal) {
                    skipped++;
                    continue;
                }

                // Check if order exists
                const { data: existing } = await supabase
                    .from('amazon_orders')
                    .select('id')
                    .eq('order_id', orderIdVal)
                    .single();

                if (existing) {
                    skipped++;
                    continue;
                }

                // Get product name from FSN
                const mapping = fsnMappings.find(m => m.fsn === fsnVal);

                // Find license key if provided
                let keyId = null;
                if (keyVal) {
                    const { data: keyData } = await supabase
                        .from('amazon_activation_license_keys')
                        .select('id')
                        .eq('license_key', keyVal)
                        .single();

                    if (keyData) {
                        keyId = keyData.id;
                    }
                }

                // Insert order
                const { error } = await supabase
                    .from('amazon_orders')
                    .insert({
                        order_id: orderIdVal,
                        fsn: fsnVal,
                        fulfillment_type: 'amazon_fba',
                        warranty_status: 'PENDING',
                        license_key_id: keyId,
                    });

                if (error) {
                    errors++;
                } else {
                    imported++;

                    // Mark key as redeemed if assigned
                    if (keyId) {
                        await supabase
                            .from('amazon_activation_license_keys')
                            .update({ is_redeemed: true, order_id: orderIdVal })
                            .eq('id', keyId);
                    }
                }

                setCsvProgress(`Processed ${imported + skipped + errors}/${dataLines.length} orders...`);
            }

            setCsvProgress(`Complete! Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors}`);

        } catch (error: any) {
            setCsvProgress(`Error: ${error.message}`);
        }

        setCsvUploading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Manual Order Creation</h1>
                <p className="text-muted-foreground">Create Amazon orders manually or upload via CSV</p>
            </div>

            {/* Message Display */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <AlertCircle className="h-5 w-5" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Manual Order Form */}
            <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Create Single Order</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Order ID */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Amazon Order ID</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => { setOrderId(e.target.value); setSecretCode(''); }}
                                    placeholder="XXX-XXXXXXX-XXXXXXX"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background font-mono"
                                    disabled={!!secretCode}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Format: 123-1234567-1234567</p>
                        </div>

                        {/* Secret Code */}
                        <div>
                            <label className="block text-sm font-medium mb-1">OR Secret Code (15 digits)</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={secretCode}
                                    onChange={(e) => { setSecretCode(e.target.value.replace(/\D/g, '').slice(0, 15)); setOrderId(''); }}
                                    placeholder="123456789012345"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background font-mono"
                                    disabled={!!orderId}
                                    maxLength={15}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">15-digit code for digital delivery</p>
                        </div>
                    </div>

                    {/* FSN Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Product FSN *</label>
                        <select
                            value={selectedFsn}
                            onChange={(e) => handleFsnChange(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-background"
                            required
                        >
                            <option value="">Select Product FSN</option>
                            {fsnMappings.map(m => (
                                <option key={m.fsn} value={m.fsn}>{m.fsn} - {m.product_title.substring(0, 50)}...</option>
                            ))}
                        </select>
                    </div>

                    {/* Product Name (auto-filled) */}
                    {productName && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Product Name</label>
                            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                                <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm">{productName}</span>
                            </div>
                        </div>
                    )}

                    {/* License Key Selection (optional) */}
                    {selectedFsn && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Assign License Key (Optional)</label>
                            <select
                                value={selectedKeyId}
                                onChange={(e) => setSelectedKeyId(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg bg-background font-mono"
                            >
                                <option value="">Select license key (optional)</option>
                                {availableKeys.map(k => (
                                    <option key={k.id} value={k.id}>{k.license_key}</option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">
                                {availableKeys.length} available keys for this FSN
                            </p>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || (!orderId && !secretCode) || !selectedFsn}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Create Order
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowCsvModal(true)}
                            className="px-6 py-2 border rounded-lg hover:bg-accent flex items-center gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Upload CSV
                        </button>
                    </div>
                </form>
            </div>

            {/* CSV Upload Modal */}
            {showCsvModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !csvUploading && setShowCsvModal(false)} />
                    <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-lg m-4">
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Upload Orders via CSV</h2>
                            <button
                                onClick={() => !csvUploading && setShowCsvModal(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                                disabled={csvUploading}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <p className="text-sm font-medium mb-2">CSV Format:</p>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                    Order ID, FSN, License Key (optional)
                                </code>
                                <p className="text-xs text-muted-foreground mt-2">
                                    First row should be header. License key column is optional.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Select CSV File</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2 border rounded-lg bg-background"
                                    disabled={csvUploading}
                                />
                            </div>

                            {csvProgress && (
                                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                                    {csvProgress}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => !csvUploading && setShowCsvModal(false)}
                                    disabled={csvUploading}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCsvUpload}
                                    disabled={csvUploading || !csvFile}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {csvUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Upload
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
