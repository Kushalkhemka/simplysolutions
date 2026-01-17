'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, MessageSquare, Clock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Ticket {
    id: string;
    ticket_number: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    updated_at: string;
    user?: { full_name: string; email: string };
}

const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    awaiting_reply: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const priorityColors: Record<string, string> = {
    low: 'border-gray-300 text-gray-600',
    medium: 'border-blue-300 text-blue-600',
    high: 'border-orange-300 text-orange-600',
    urgent: 'border-red-500 text-red-600 bg-red-50',
};

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/tickets');
            const data = await res.json();
            if (data.success) {
                setTickets(data.data);
            }
        } catch (error) {
            toast.error('Failed to load tickets');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
            ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
            ticket.user?.email?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const stats = {
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        awaiting: tickets.filter(t => t.status === 'awaiting_reply').length,
        urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Support Tickets</h1>
                    <p className="text-muted-foreground">Manage customer support requests</p>
                </div>
                <Button onClick={fetchTickets} variant="outline" size="sm">
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
                    <div className="text-sm text-muted-foreground">Open</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{stats.awaiting}</div>
                    <div className="text-sm text-muted-foreground">Awaiting Reply</div>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                    <div className="text-sm text-muted-foreground">Urgent</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by ticket number, subject, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="awaiting_reply">Awaiting Reply</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            {/* Tickets Table */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium">Ticket</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">Customer</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">Priority</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                                <th className="text-left px-4 py-3 text-sm font-medium">Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                                        No tickets found
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/support/${ticket.id}`} className="block">
                                                <div className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</div>
                                                <div className="font-medium truncate max-w-xs">{ticket.subject}</div>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm">{ticket.user?.full_name || 'Anonymous'}</div>
                                            <div className="text-xs text-muted-foreground">{ticket.user?.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={priorityColors[ticket.priority]}>
                                                {ticket.priority}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusColors[ticket.status]}>
                                                {ticket.status.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(ticket.updated_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
