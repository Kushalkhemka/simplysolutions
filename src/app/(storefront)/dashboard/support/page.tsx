'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, MessageSquare, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
}

const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    awaiting_reply: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
};

const categoryLabels: Record<string, string> = {
    order_issue: 'Order Issue',
    license_issue: 'License Issue',
    payment: 'Payment',
    technical: 'Technical',
    other: 'Other',
};

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/tickets');
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
        const matchesSearch = ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
            ticket.ticket_number.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || ticket.status === filter;
        return matchesSearch && matchesFilter;
    });

    const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const awaitingCount = tickets.filter(t => t.status === 'awaiting_reply').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Support Tickets</h1>
                    <p className="text-muted-foreground">Get help with your orders and licenses</p>
                </div>
                <Link href="/dashboard/support/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Ticket
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{openCount}</div>
                    <div className="text-sm text-muted-foreground">Open</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{awaitingCount}</div>
                    <div className="text-sm text-muted-foreground">Awaiting Reply</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
                    <div className="text-sm text-muted-foreground">Resolved</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tickets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'open', 'in_progress', 'awaiting_reply', 'resolved'].map(status => (
                        <Button
                            key={status}
                            variant={filter === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(status)}
                        >
                            {status === 'all' ? 'All' : status.replace('_', ' ')}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Ticket List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No tickets found</h3>
                    <p className="text-muted-foreground mb-4">
                        {tickets.length === 0 ? "You haven't created any support tickets yet." : "No tickets match your search."}
                    </p>
                    <Link href="/dashboard/support/new">
                        <Button>Create Your First Ticket</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTickets.map(ticket => (
                        <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`}>
                            <div className="border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                                            <Badge className={priorityColors[ticket.priority]} variant="secondary">
                                                {ticket.priority}
                                            </Badge>
                                        </div>
                                        <h3 className="font-medium truncate">{ticket.subject}</h3>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                            <span>{categoryLabels[ticket.category] || ticket.category}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className={statusColors[ticket.status]}>
                                        {ticket.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
