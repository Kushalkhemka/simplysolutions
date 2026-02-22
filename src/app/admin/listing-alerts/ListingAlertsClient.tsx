'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, AlertTriangle, CheckCircle, ExternalLink, Shield, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FlaggedProduct {
    asin: string;
    productKey: string;
    title: string;
    flaggedKeywords: string[];
    locations: string[];
    url: string;
    imageUrl: string | null;  // Main product image
    isNew: boolean;
}

interface ScanResult {
    success: boolean;
    message: string;
    productsScanned: number;
    productsFlagged: number;
    newProductsFlagged: number;
    baselineIgnored: number;
    newFlaggedProducts: FlaggedProduct[];
    allFlaggedProducts: FlaggedProduct[];
    alertSent: boolean;
    pushSent?: boolean;
    errors?: string[];
    duration: string;
    scannedAt?: string;
}

export default function ListingAlertsClient() {
    const [lastScan, setLastScan] = useState<ScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanTime, setLastScanTime] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const runScan = useCallback(async () => {
        setIsScanning(true);
        try {
            const cronSecret = 'simplysolutions-cron-2026'; // Should be from env in production
            const response = await fetch('/api/cron/monitor-listings', {
                headers: {
                    'Authorization': `Bearer ${cronSecret}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setLastScan(data);
                setLastScanTime(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

                if (data.newProductsFlagged > 0) {
                    toast.error(`🚨 ${data.newProductsFlagged} NEW products flagged!`);
                } else if (data.productsFlagged > 0) {
                    toast.info(`${data.baselineIgnored} baseline products have known keywords (ignored)`);
                } else {
                    toast.success('All products clean!');
                }
            } else {
                toast.error(data.error || 'Scan failed');
            }
        } catch (error) {
            console.error('Scan error:', error);
            toast.error('Failed to run scan');
        } finally {
            setIsScanning(false);
        }
    }, []);

    // Load last scan on mount
    useEffect(() => {
        const loadLastScan = async () => {
            try {
                const response = await fetch('/api/admin/listing-alerts/last-scan');
                const data = await response.json();

                if (data.success && data.hasData) {
                    setLastScan(data);
                    setLastScanTime(new Date(data.scannedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
                }
            } catch (error) {
                console.error('Failed to load last scan:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadLastScan();
    }, []);

    const getStatusColor = (product: FlaggedProduct) => {
        return product.isNew ? 'bg-red-100 border-red-300 dark:bg-red-900/30' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                        Listing Monitor
                    </h1>
                    <p className="text-sm text-muted-foreground">Monitor Amazon listings for flagged keywords</p>
                </div>
                <button
                    onClick={runScan}
                    disabled={isScanning}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 w-full sm:w-auto"
                >
                    {isScanning ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Scanning...
                        </>
                    ) : (
                        <>
                            <PlayCircle className="h-4 w-4" />
                            Run Scan Now
                        </>
                    )}
                </button>
            </div>

            {/* Last Scan Info */}
            {lastScanTime && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Last scan: {lastScanTime} ({lastScan?.duration})
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-2">About This Monitor</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Runs automatically every <strong>1 hour</strong> via cron</li>
                    <li>Scans all product titles, descriptions, and bullet points</li>
                    <li>Flagged keywords: email, digital download, code delivery, instant delivery</li>
                    <li>Ignores 3 baseline products with known safe keyword usage</li>
                    <li>Sends email + push notification when NEW keywords detected</li>
                </ul>
            </div>

            {/* Scan Results */}
            {lastScan && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        <div className="bg-card border rounded-lg p-4">
                            <p className="text-2xl font-bold">{lastScan.productsScanned}</p>
                            <p className="text-sm text-muted-foreground">Products Scanned</p>
                        </div>
                        <div className="bg-card border rounded-lg p-4">
                            <p className="text-2xl font-bold">{lastScan.productsFlagged}</p>
                            <p className="text-sm text-muted-foreground">Total Flagged</p>
                        </div>
                        <div className={`border rounded-lg p-4 ${lastScan.newProductsFlagged > 0 ? 'bg-red-100 dark:bg-red-900/30 border-red-300' : 'bg-card'}`}>
                            <p className={`text-2xl font-bold ${lastScan.newProductsFlagged > 0 ? 'text-red-600' : ''}`}>
                                {lastScan.newProductsFlagged}
                            </p>
                            <p className="text-sm text-muted-foreground">NEW Flagged ⚠️</p>
                        </div>
                        <div className="bg-card border rounded-lg p-4">
                            <p className="text-2xl font-bold text-yellow-600">{lastScan.baselineIgnored}</p>
                            <p className="text-sm text-muted-foreground">Baseline (Ignored)</p>
                        </div>
                        <div className="bg-card border rounded-lg p-4">
                            <p className="text-2xl font-bold flex items-center gap-1">
                                {lastScan.alertSent ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </p>
                            <p className="text-sm text-muted-foreground">Alert Sent</p>
                        </div>
                    </div>

                    {/* New Flagged Products (Critical) */}
                    {lastScan.newProductsFlagged > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
                            <h3 className="font-bold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                🚨 NEW Flagged Products - IMMEDIATE ACTION REQUIRED
                            </h3>
                            <div className="space-y-3">
                                {lastScan.newFlaggedProducts.map((product) => (
                                    <div key={product.asin} className="bg-white dark:bg-gray-800 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <a
                                                    href={product.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-mono text-lg font-bold text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    {product.asin}
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                                <p className="text-sm text-muted-foreground">{product.productKey}</p>
                                                <p className="text-sm mt-1">{product.title}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="text-xs text-muted-foreground">Keywords:</span>
                                            {product.flaggedKeywords.map(k => (
                                                <span key={k} className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                                                    {k}
                                                </span>
                                            ))}
                                            <span className="text-xs text-muted-foreground ml-2">Found in:</span>
                                            {product.locations.map(l => (
                                                <span key={l} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">
                                                    {l}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Flagged Products - Mobile Card View */}
                    {lastScan.allFlaggedProducts.length > 0 && (
                        <div className="lg:hidden space-y-3">
                            <div className="bg-muted/50 px-4 py-3 border rounded-lg">
                                <h3 className="font-medium">All Flagged Products</h3>
                            </div>
                            {lastScan.allFlaggedProducts.map((product) => (
                                <div key={`mobile-${product.asin}`} className={`border rounded-lg p-4 ${getStatusColor(product)}`}>
                                    <div className="flex items-start gap-3">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.title}
                                                className="w-12 h-12 object-contain rounded border shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-muted-foreground shrink-0">N/A</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {product.isNew ? (
                                                    <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">NEW</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 text-xs bg-yellow-500 text-white rounded-full">Baseline</span>
                                                )}
                                                <a
                                                    href={product.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-mono text-sm text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    {product.asin}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                            <p className="text-sm mt-1 line-clamp-2">{product.title}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {product.flaggedKeywords.map(k => (
                                                    <span key={k} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                                                        {k}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Found in: {product.locations.join(', ')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* All Flagged Products - Desktop Table View */}
                    {lastScan.allFlaggedProducts.length > 0 && (
                        <div className="hidden lg:block bg-card border rounded-lg overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 border-b">
                                <h3 className="font-medium">All Flagged Products</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Image</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">ASIN</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Keywords</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {lastScan.allFlaggedProducts.map((product) => (
                                            <tr key={product.asin} className={getStatusColor(product)}>
                                                <td className="px-4 py-3">
                                                    {product.isNew ? (
                                                        <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full font-bold">NEW</span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs bg-yellow-500 text-white rounded-full">Baseline</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.title}
                                                            className="w-12 h-12 object-contain rounded border"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <a
                                                        href={product.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-mono text-sm text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        {product.asin}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </td>
                                                <td className="px-4 py-3 text-sm max-w-xs truncate" title={product.title}>
                                                    {product.title}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {product.flaggedKeywords.map(k => (
                                                        <span key={k} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded mr-1">
                                                            {k}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {product.locations.join(', ')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Errors */}
                    {lastScan.errors && lastScan.errors.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <h3 className="font-medium text-yellow-800 dark:text-yellow-400 mb-2">Scan Errors</h3>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                                {lastScan.errors.map((err, i) => (
                                    <li key={i} className="font-mono">{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}

            {/* No Scan Yet */}
            {!lastScan && !isScanning && (
                <div className="bg-card border rounded-lg p-8 text-center">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Scan Results Yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        Click &quot;Run Scan Now&quot; to check your Amazon listings for flagged keywords
                    </p>
                </div>
            )}
        </div>
    );
}
