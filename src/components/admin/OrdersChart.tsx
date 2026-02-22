'use client';

import { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    BarChart,
    Bar,
} from 'recharts';
import { BarChart3, Loader2, TrendingUp, Truck, Package, Key } from 'lucide-react';

type Period = 'today' | 'yesterday' | '7d' | '30d';

interface ChartDataPoint {
    label: string;
    mfn: number;
    fba: number;
    keysAdded: number;
    total: number;
    keysRedeemed: number;
}

interface Summary {
    totalOrders: number;
    mfn: number;
    fba: number;
    keysAdded: number;
    keysRedeemed: number;
}

const periodLabels: Record<Period, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border rounded-lg shadow-xl p-3 text-sm">
                <p className="font-semibold mb-1.5 text-foreground">{label}</p>
                {payload.map((entry: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 py-0.5">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium text-foreground">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function OrdersChart() {
    const [period, setPeriod] = useState<Period>('7d');
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartType, setChartType] = useState<'area' | 'bar'>('area');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/analytics/chart-data?period=${period}`);
                const data = await res.json();
                setChartData(data.chartData || []);
                setSummary(data.summary || null);
            } catch (err) {
                console.error('Failed to fetch chart data:', err);
            }
            setLoading(false);
        };
        fetchData();
    }, [period]);

    return (
        <div className="bg-card border rounded-lg">
            {/* Header */}
            <div className="p-4 border-b flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        <h2 className="font-semibold">Orders Overview</h2>
                    </div>
                    {/* Chart Type Toggle */}
                    <div className="flex bg-muted rounded-lg p-0.5">
                        <button
                            onClick={() => setChartType('area')}
                            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${chartType === 'area'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Area
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${chartType === 'bar'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Bar
                        </button>
                    </div>
                </div>

                {/* Period Selector - scrollable on mobile */}
                <div className="flex overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex bg-muted rounded-lg p-0.5 min-w-max">
                        {(Object.keys(periodLabels) as Period[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${period === p
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {periodLabels[p]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            {summary && !loading && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 border-b">
                    <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-foreground flex-shrink-0" />
                        <div>
                            <p className="text-lg font-bold leading-none">{summary.totalOrders}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Total</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-blue-500/10 rounded-lg">
                        <Truck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div>
                            <p className="text-lg font-bold leading-none text-blue-500">{summary.mfn}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">MFN</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-orange-500/10 rounded-lg">
                        <Package className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <div>
                            <p className="text-lg font-bold leading-none text-orange-500">{summary.fba}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">FBA</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 rounded-lg">
                        <Key className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <div>
                            <p className="text-lg font-bold leading-none text-emerald-500">{summary.keysAdded}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Keys Added</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-purple-500/10 rounded-lg">
                        <Key className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        <div>
                            <p className="text-lg font-bold leading-none text-purple-500">{summary.keysRedeemed}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Keys</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="p-4">
                {loading ? (
                    <div className="h-[350px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="text-sm">Loading chart data...</span>
                        </div>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                        No order data for this period
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        {chartType === 'area' ? (
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gradMfn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradFba" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradKeysAdded" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradKeys" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11 }}
                                    className="text-muted-foreground"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    className="text-muted-foreground"
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="mfn"
                                    name="MFN Orders"
                                    stroke="#3b82f6"
                                    fill="url(#gradMfn)"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="fba"
                                    name="FBA Orders"
                                    stroke="#f97316"
                                    fill="url(#gradFba)"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="keysAdded"
                                    name="Keys Added"
                                    stroke="#10b981"
                                    fill="url(#gradKeysAdded)"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="keysRedeemed"
                                    name="Keys Redeemed"
                                    stroke="#a855f7"
                                    fill="url(#gradKeys)"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 2 }}
                                />
                            </AreaChart>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11 }}
                                    className="text-muted-foreground"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    className="text-muted-foreground"
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                />
                                <Bar dataKey="mfn" name="MFN Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="fba" name="FBA Orders" fill="#f97316" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="keysAdded" name="Keys Added" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="keysRedeemed" name="Keys Redeemed" fill="#a855f7" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
