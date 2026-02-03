'use client';

import { useState, useEffect } from 'react';

interface StateDelay {
    id: string;
    state_name: string;
    delay_days: number;
    created_at: string;
    updated_at: string;
}

export default function FBASettingsClient() {
    const [stateDelays, setStateDelays] = useState<StateDelay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(3);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newStateName, setNewStateName] = useState('');
    const [newDelayDays, setNewDelayDays] = useState(3);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchStateDelays();
    }, []);

    const fetchStateDelays = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/fba-state-delays');
            const data = await response.json();
            if (data.success) {
                setStateDelays(data.data);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch state delays');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (state: StateDelay) => {
        setEditingId(state.id);
        setEditValue(state.delay_days);
    };

    const handleSave = async (id: string) => {
        setSaving(true);
        try {
            const response = await fetch('/api/admin/fba-state-delays', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, delay_days: editValue })
            });
            const data = await response.json();
            if (data.success) {
                setStateDelays(prev =>
                    prev.map(s => s.id === id ? { ...s, delay_days: editValue } : s)
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

        setSaving(true);
        try {
            const response = await fetch('/api/admin/fba-state-delays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state_name: newStateName,
                    delay_days: newDelayDays
                })
            });
            const data = await response.json();
            if (data.success) {
                setStateDelays(prev => [...prev, data.data].sort((a, b) =>
                    a.state_name.localeCompare(b.state_name)
                ));
                setShowAddForm(false);
                setNewStateName('');
                setNewDelayDays(3);
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
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FBA Delivery Settings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Configure delivery delays for each state. Orders will be locked for activation until the delay period passes.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                        State Delivery Delays ({stateDelays.length} states)
                    </h2>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Add State
                    </button>
                </div>

                {showAddForm && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                        <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Add New State</h3>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">State Name</label>
                                <input
                                    type="text"
                                    value={newStateName}
                                    onChange={(e) => setNewStateName(e.target.value.toUpperCase())}
                                    placeholder="e.g., KARNATAKA"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Delay Days</label>
                                <input
                                    type="number"
                                    value={newDelayDays}
                                    onChange={(e) => setNewDelayDays(parseInt(e.target.value) || 1)}
                                    min="1"
                                    max="14"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={saving}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {saving ? 'Adding...' : 'Add'}
                            </button>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stateDelays.map((state) => (
                        <div
                            key={state.id}
                            className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {state.state_name}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                {editingId === state.id ? (
                                    <>
                                        <input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(parseInt(e.target.value) || 1)}
                                            min="1"
                                            max="14"
                                            className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <span className="text-gray-600 dark:text-gray-400">days</span>
                                        <button
                                            onClick={() => handleSave(state.id)}
                                            disabled={saving}
                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                            {state.delay_days} days
                                        </span>
                                        <button
                                            onClick={() => handleEdit(state)}
                                            className="px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(state.id, state.state_name)}
                                            className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {stateDelays.length === 0 && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No state delays configured. Add states to set delivery restrictions.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                    ⚠️ Default Delay
                </h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                    States not listed here will use a default delay of <strong>4 days</strong>.
                    This ensures all orders have a minimum waiting period for fraud prevention.
                </p>
            </div>
        </div>
    );
}
