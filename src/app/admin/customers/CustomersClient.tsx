'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Edit, Trash2, Shield, ShieldCheck, User, MoreVertical, Search, Loader2 } from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: 'customer' | 'admin' | 'super_admin';
    is_active: boolean;
    created_at: string;
    last_login_at: string | null;
    order_count: number;
}

interface CustomersClientProps {
    initialUsers: Profile[];
    currentUserRole: string;
    currentUserId: string;
}

export default function CustomersClient({ initialUsers, currentUserRole, currentUserId }: CustomersClientProps) {
    const [users, setUsers] = useState<Profile[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [newRole, setNewRole] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const isSuperAdmin = currentUserRole === 'super_admin';

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleUpdateRole = async (userId: string, role: string) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update user');
            }

            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, role: role as Profile['role'] } : u
            ));
            setSuccess(`Role updated to ${role}`);
            setEditingUser(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (userId: string, currentActive: boolean) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, is_active: !currentActive }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update user');
            }

            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, is_active: !currentActive } : u
            ));
            setSuccess(`User ${!currentActive ? 'activated' : 'deactivated'}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!confirm(`Are you sure you want to delete ${email}? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/users?userId=${userId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete user');
            }

            setUsers(prev => prev.filter(u => u.id !== userId));
            setSuccess('User deleted successfully');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Super Admin</Badge>;
            case 'admin':
                return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Admin</Badge>;
            default:
                return <Badge variant="secondary">Customer</Badge>;
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <ShieldCheck className="h-4 w-4 text-red-400" />;
            case 'admin':
                return <Shield className="h-4 w-4 text-orange-400" />;
            default:
                return <User className="h-4 w-4 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Customers</h1>
                    <p className="text-muted-foreground">
                        View and manage customer accounts
                        {isSuperAdmin && <span className="text-primary"> (Super Admin Mode)</span>}
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Customers</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'customer').length}</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Admins</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Super Admins</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'super_admin').length}</p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            {/* Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left p-4 font-medium">Customer</th>
                                <th className="text-left p-4 font-medium">Email</th>
                                <th className="text-center p-4 font-medium">Orders</th>
                                <th className="text-center p-4 font-medium">Role</th>
                                <th className="text-center p-4 font-medium">Status</th>
                                <th className="text-left p-4 font-medium">Joined</th>
                                <th className="text-left p-4 font-medium">Last Login</th>
                                {isSuperAdmin && (
                                    <th className="text-center p-4 font-medium">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <span className="font-medium">{user.full_name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{user.email}</td>
                                    <td className="p-4 text-center">
                                        <span className="font-medium">{user.order_count}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {editingUser === user.id ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <select
                                                    value={newRole || user.role}
                                                    onChange={(e) => setNewRole(e.target.value)}
                                                    className="bg-muted border border-border rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="customer">Customer</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleUpdateRole(user.id, newRole || user.role)}
                                                    disabled={loading}
                                                    className="h-6 px-2 text-xs"
                                                >
                                                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => { setEditingUser(null); setNewRole(''); }}
                                                    className="h-6 px-2 text-xs"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            getRoleBadge(user.role)
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <Badge
                                            variant={user.is_active ? 'default' : 'secondary'}
                                            className={user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}
                                        >
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {user.last_login_at
                                            ? new Date(user.last_login_at).toLocaleDateString('en-IN')
                                            : 'Never'
                                        }
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1">
                                                {user.id !== currentUserId && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingUser(user.id);
                                                                setNewRole(user.role);
                                                            }}
                                                            className="h-8 w-8 p-0"
                                                            title="Edit Role"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleToggleActive(user.id, user.is_active)}
                                                            disabled={loading}
                                                            className="h-8 w-8 p-0"
                                                            title={user.is_active ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {user.is_active ? (
                                                                <User className="h-4 w-4 text-yellow-400" />
                                                            ) : (
                                                                <User className="h-4 w-4 text-green-400" />
                                                            )}
                                                        </Button>
                                                        {user.order_count === 0 && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteUser(user.id, user.email)}
                                                                disabled={loading}
                                                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                                {user.id === currentUserId && (
                                                    <span className="text-xs text-muted-foreground">(You)</span>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{searchQuery ? 'No users found matching your search' : 'No customers yet'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
