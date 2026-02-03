'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Pencil, Trash2, Check, X, AlertTriangle, Settings } from 'lucide-react';

interface StateDelay {
    id: string;
    state_name: string;
    delay_hours: number;
    created_at: string;
    updated_at: string;
}

// Helper to format hours nicely
function formatDelay(hours: number): string {
    if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
        return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return `${days}d ${remainingHours}h`;
}

export default function FBASettingsClient() {
    const [stateDelays, setStateDelays] = useState<StateDelay[]>([]);
    const [defaultDelay, setDefaultDelay] = useState<StateDelay | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(72);
    const [editUnit, setEditUnit] = useState<'hours' | 'days'>('days');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newStateName, setNewStateName] = useState('');
    const [newDelayValue, setNewDelayValue] = useState(3);
    const [newDelayUnit, setNewDelayUnit] = useState<'hours' | 'days'>('days');
    const [saving, setSaving] = useState(false);
    const [editingDefault, setEditingDefault] = useState(false);
    const [defaultEditValue, setDefaultEditValue] = useState(96);
    const [defaultEditUnit, setDefaultEditUnit] = useState<'hours' | 'days'>('days');

    useEffect(() => {
        fetchStateDelays();
    }, []);

    const fetchStateDelays = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/fba-state-delays');
            const data = await response.json();
            if (data.success) {
                // Separate DEFAULT from regular states
                const allDelays = data.data as StateDelay[];
                const defaultEntry = allDelays.find(d => d.state_name === 'DEFAULT');
                const stateEntries = allDelays.filter(d => d.state_name !== 'DEFAULT');

                setDefaultDelay(defaultEntry || null);
                setStateDelays(stateEntries);
                if (defaultEntry) {
                    setDefaultEditValue(defaultEntry.delay_hours);
                    setDefaultEditUnit(defaultEntry.delay_hours % 24 === 0 && defaultEntry.delay_hours >= 24 ? 'days' : 'hours');
                }
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch state delays');
        } finally {
            setLoading(false);
        }
    };

    const toHours = (value: number, unit: 'hours' | 'days'): number => {
        return unit === 'days' ? value * 24 : value;
    };

    const handleEdit = (state: StateDelay) => {
        setEditingId(state.id);
        // Determine best unit to display
        if (state.delay_hours % 24 === 0 && state.delay_hours >= 24) {
            setEditValue(state.delay_hours / 24);
            setEditUnit('days');
        } else {
            setEditValue(state.delay_hours);
            setEditUnit('hours');
        }
    };

    const handleSave = async (id: string) => {
        setSaving(true);
        const hours = toHours(editValue, editUnit);
        try {
            const response = await fetch('/api/admin/fba-state-delays', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, delay_hours: hours })
            });
            const data = await response.json();
            if (data.success) {
                setStateDelays(prev =>
                    prev.map(s => s.id === id ? { ...s, delay_hours: hours } : s)
                );
                setEditingId(null);
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDefault = async () => {
        setSaving(true);
        const hours = toHours(defaultEditValue, defaultEditUnit);
        try {
            if (defaultDelay) {
                // Update existing default
                const response = await fetch('/api/admin/fba-state-delays', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: defaultDelay.id, delay_hours: hours })
                });
                const data = await response.json();
                if (data.success) {
                    setDefaultDelay({ ...defaultDelay, delay_hours: hours });
                    setEditingDefault(false);
                } else {
                    alert(data.error);
                }
            } else {
                // Create new default entry
                const response = await fetch('/api/admin/fba-state-delays', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ state_name: 'DEFAULT', delay_hours: hours })
                });
                const data = await response.json();
                if (data.success) {
                    setDefaultDelay(data.data);
                    setEditingDefault(false);
                } else {
                    alert(data.error);
                }
            }
        } catch (err) {
            alert('Failed to save default delay');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, stateName: string) => {
        if (!confirm(`Are you sure you want to delete ${stateName}?`)) return;

        try {
            const response = await fetch(`/api/admin/fba-state-delays?id=${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                setStateDelays(prev => prev.filter(s => s.id !== id));
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const handleAdd = async () => {
        if (!newStateName.trim()) {
            alert('Please enter a state name');
            return;
        }

        if (newStateName.toUpperCase() === 'DEFAULT') {
            alert('Use the Default Delay card to set the default delay');
            return;
        }

        setSaving(true);
        const hours = toHours(newDelayValue, newDelayUnit);
        try {
            const response = await fetch('/api/admin/fba-state-delays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state_name: newStateName,
                    delay_hours: hours
                })
            });
            const data = await response.json();
            if (data.success) {
                setStateDelays(prev => [...prev, data.data].sort((a, b) =>
                    a.state_name.localeCompare(b.state_name)
                ));
                setShowAddForm(false);
                setNewStateName('');
                setNewDelayValue(3);
                setNewDelayUnit('days');
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to add state');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-64 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">FBA Delivery Settings</h1>
                </div>
                <p className="text-muted-foreground">
                    Configure delivery delays for each state. Orders will be locked until the delay period passes after order creation.
                </p>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg mb-6 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Default Delay Card - Editable */}
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Settings className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-600 dark:text-amber-400">Default Delay</h3>
                            <p className="text-sm text-muted-foreground">
                                Applied to states not listed below
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {editingDefault ? (
                            <>
                                <input
                                    type="number"
                                    value={defaultEditValue}
                                    onChange={(e) => setDefaultEditValue(parseInt(e.target.value) || 1)}
                                    min="1"
                                    max={defaultEditUnit === 'days' ? 14 : 336}
                                    className="w-16 px-2 py-1 border rounded bg-background text-foreground text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                                <select
                                    value={defaultEditUnit}
                                    onChange={(e) => setDefaultEditUnit(e.target.value as 'hours' | 'days')}
                                    className="px-2 py-1 border rounded bg-background text-foreground focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                >
                                    <option value="hours">hours</option>
                                    <option value="days">days</option>
                                </select>
                                <button
                                    onClick={handleSaveDefault}
                                    disabled={saving}
                                    className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingDefault(false);
                                        const hours = defaultDelay?.delay_hours || 96;
                                        if (hours % 24 === 0 && hours >= 24) {
                                            setDefaultEditValue(hours / 24);
                                            setDefaultEditUnit('days');
                                        } else {
                                            setDefaultEditValue(hours);
                                            setDefaultEditUnit('hours');
                                        }
                                    }}
                                    className="p-1.5 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-lg">
                                    {formatDelay(defaultDelay?.delay_hours || 96)}
                                </span>
                                <button
                                    onClick={() => {
                                        setEditingDefault(true);
                                        const hours = defaultDelay?.delay_hours || 96;
                                        if (hours % 24 === 0 && hours >= 24) {
                                            setDefaultEditValue(hours / 24);
                                            setDefaultEditUnit('days');
                                        } else {
                                            setDefaultEditValue(hours);
                                            setDefaultEditUnit('hours');
                                        }
                                    }}
                                    className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded transition-colors"
                                    title="Edit default delay"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30">
                    <div>
                        <h2 className="font-semibold">State-Specific Delays</h2>
                        <p className="text-sm text-muted-foreground">{stateDelays.length} states with custom delays</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add State
                    </button>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="p-4 bg-primary/5 border-b">
                        <h3 className="font-medium mb-3 text-sm">Add New State</h3>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                            <div className="flex-1 min-w-0">
                                <label className="block text-xs text-muted-foreground mb-1.5">State Name</label>
                                <input
                                    type="text"
                                    value={newStateName}
                                    onChange={(e) => setNewStateName(e.target.value.toUpperCase())}
                                    placeholder="e.g., KARNATAKA"
                                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="w-20">
                                <label className="block text-xs text-muted-foreground mb-1.5">Delay</label>
                                <input
                                    type="number"
                                    value={newDelayValue}
                                    onChange={(e) => setNewDelayValue(parseInt(e.target.value) || 1)}
                                    min="1"
                                    max={newDelayUnit === 'days' ? 14 : 336}
                                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                                <div className="w-24">
                                    <label className="block text-xs text-muted-foreground mb-1.5">Unit</label>
                                    <select
                                        value={newDelayUnit}
                                        onChange={(e) => setNewDelayUnit(e.target.value as 'hours' | 'days')}
                                        className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    >
                                        <option value="hours">hours</option>
                                        <option value="days">days</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleAdd}
                                    disabled={saving}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    <Check className="h-4 w-4" />
                                    {saving ? 'Adding...' : 'Add'}
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* State List */}
                <div className="divide-y">
                    {stateDelays.map((state, index) => (
                        <div
                            key={state.id}
                            className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                                    {state.state_name.charAt(0)}
                                </div>
                                <p className="font-medium">{state.state_name}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {editingId === state.id ? (
                                    <>
                                        <input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(parseInt(e.target.value) || 1)}
                                            min="1"
                                            max={editUnit === 'days' ? 14 : 336}
                                            className="w-16 px-2 py-1 border rounded bg-background text-foreground text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        />
                                        <select
                                            value={editUnit}
                                            onChange={(e) => setEditUnit(e.target.value as 'hours' | 'days')}
                                            className="px-2 py-1 border rounded bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        >
                                            <option value="hours">hours</option>
                                            <option value="days">days</option>
                                        </select>
                                        <button
                                            onClick={() => handleSave(state.id)}
                                            disabled={saving}
                                            className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1.5 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                            {formatDelay(state.delay_hours)}
                                        </span>
                                        <button
                                            onClick={() => handleEdit(state)}
                                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(state.id, state.state_name)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {stateDelays.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">No state-specific delays configured</p>
                            <p className="text-sm text-muted-foreground mt-1">All states will use the default delay above</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lock Calculation Info */}
            <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-start gap-3">
                <div className="p-1.5 bg-blue-500/20 rounded-lg mt-0.5">
                    <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                    <h3 className="font-medium text-blue-600 dark:text-blue-400">How Lock Works</h3>
                    <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                        <strong>Redeemable Date</strong> = Order Date + State Delay (or Default)<br />
                        Orders with <strong>Pending</strong> status are always blocked regardless of dates.
                    </p>
                </div>
            </div>
        </div>
    );
}
