'use client';

import { useState } from 'react';
import { Key, Copy, CheckCircle, Loader2, AlertTriangle, Terminal, History } from 'lucide-react';
import { toast } from 'sonner';

export default function GetCIDTestPage() {
    const [identifier, setIdentifier] = useState('');
    const [installationId, setInstallationId] = useState('');
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const formatInstallationId = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 63);
        const groups = digits.match(/.{1,7}/g) || [];
        return groups.join(' ');
    };

    const handleTest = async () => {
        if (!identifier.trim() || !installationId.trim()) {
            toast.error('Please enter both identifier and Installation ID');
            return;
        }

        const cleanIid = installationId.replace(/\s/g, '');
        if (cleanIid.length !== 63) {
            toast.error('Installation ID must be 63 digits');
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/getcid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: identifier.trim(),
                    installationId: cleanIid
                }),
            });

            const data = await response.json();
            setResult(data);

            // Detect type for history display
            const type = /^\d{15,17}$/.test(identifier.trim()) ? 'Secret Code' : 'Order ID';

            setHistory(prev => [{
                identifier: identifier.trim(),
                type,
                iid: cleanIid.slice(0, 10) + '...',
                success: data.success,
                cid: data.confirmationId?.slice(0, 12) + '...' || data.error,
                time: new Date().toLocaleTimeString()
            }, ...prev.slice(0, 9)]);

            if (data.success) {
                toast.success('GetCID API call successful!');
            } else {
                toast.error(data.error || 'API call failed');
            }
        } catch (error) {
            console.error('GetCID test error:', error);
            toast.error('Network error');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied!');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Terminal className="h-6 w-6" />
                    GetCID API Test
                </h1>
                <p className="text-muted-foreground">Test the GetCID API with Order IDs or Secret Codes</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">API Test Console</h2>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Order ID or Secret Code
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="XXX-XXXXXXX-XXXXXXX or 123456789012345"
                            className="w-full px-4 py-2 border rounded-lg font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            FBA: Order ID format | Digital: 15-digit secret code
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Installation ID (63 digits)
                        </label>
                        <input
                            type="text"
                            value={installationId}
                            onChange={(e) => setInstallationId(formatInstallationId(e.target.value))}
                            placeholder="Enter the 63-digit Installation ID"
                            className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {installationId.replace(/\s/g, '').length}/63 digits
                        </p>
                    </div>

                    <button
                        onClick={handleTest}
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Calling API...
                            </>
                        ) : (
                            <>
                                <Key className="h-4 w-4" />
                                Test GetCID API
                            </>
                        )}
                    </button>
                </div>

                {/* Result */}
                <div className="bg-card border rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">API Response</h2>

                    {result ? (
                        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                            {result.success ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="font-semibold">Success!</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-green-600 dark:text-green-500 mb-1">Confirmation ID:</p>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm font-mono bg-white dark:bg-card px-2 py-1 rounded break-all">
                                                {result.confirmationId}
                                            </code>
                                            <button onClick={() => copyToClipboard(result.confirmationId)} className="text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 p-1 rounded">
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="font-semibold">Error</span>
                                    </div>
                                    <p className="text-sm text-red-700 dark:text-red-400">{result.error}</p>
                                    {result.canRetry && (
                                        <p className="text-xs text-red-600 dark:text-red-500">You can retry this request.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <Terminal className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>Enter an identifier and Installation ID to test the API</p>
                        </div>
                    )}

                    {/* History */}
                    {history.length > 0 && (
                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                                <History className="h-4 w-4" />
                                Recent Tests
                            </h3>
                            <div className="space-y-2">
                                {history.map((item, i) => (
                                    <div key={i} className={`text-xs p-2 rounded ${item.success ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <div className="flex justify-between">
                                            <span className="font-mono">{item.identifier}</span>
                                            <span className="text-muted-foreground">{item.time}</span>
                                        </div>
                                        <div className="text-muted-foreground">{item.cid}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* API Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">API Info</h3>
                <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <p><strong>Note:</strong> Each order ID or secret code can only be used once for GetCID generation.</p>
                </div>
            </div>
        </div>
    );
}
