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
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Support Tickets</h1>
                    <p className="text-muted-foreground mt-1">Get help with your orders and licenses</p>
                </div>
                <Link href="/dashboard/support/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Ticket
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="border rounded-lg p-6 bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">Open Tickets</h3>
                    </div>
                    <p className="text-3xl font-bold text-blue-600 mb-1">{openCount}</p>
                    <p className="text-sm text-muted-foreground">Waiting for response</p>
                </div>

                <div className="border rounded-lg p-6 bg-purple-50 dark:bg-purple-950/20">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold">Awaiting Reply</h3>
                    </div>
                    <p className="text-3xl font-bold text-purple-600 mb-1">{awaitingCount}</p>
                    <p className="text-sm text-muted-foreground">Action required</p>
                </div>

                <div className="border rounded-lg p-6 bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold">Resolved</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-600 mb-1">{resolvedCount}</p>
                    <p className="text-sm text-muted-foreground">Successfully closed</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tickets by subject or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                        {['all', 'open', 'in_progress', 'awaiting_reply', 'resolved'].map(status => (
                            <Button
                                key={status}
                                variant={filter === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(status)}
                                className="whitespace-nowrap flex-shrink-0"
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ticket List */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="border rounded-lg p-12 text-center bg-muted/30">
                    <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2">No tickets found</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        {tickets.length === 0
                            ? "You haven't created any support tickets yet. Need help? Create one now."
                            : "No tickets match your search criteria. Try adjusting your filters."}
                    </p>
                    {tickets.length === 0 && (
                        <Link href="/dashboard/support/new">
                            <Button size="lg">Create Your First Ticket</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <div className="p-4 border-b bg-muted/30">
                        <h2 className="font-semibold">Your Tickets</h2>
                    </div>
                    <div className="divide-y">
                        {filteredTickets.map(ticket => (
                            <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`} className="block hover:bg-muted/30 transition-colors">
                                <div className="p-4 sm:p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                                    #{ticket.ticket_number}
                                                </span>
                                                <Badge className={priorityColors[ticket.priority]} variant="secondary">
                                                    {ticket.priority}
                                                </Badge>
                                            </div>
                                            <h3 className="font-medium text-lg mb-1 truncate">{ticket.subject}</h3>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <span>{categoryLabels[ticket.category] || ticket.category}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className={`${statusColors[ticket.status]} whitespace-nowrap`}>
                                            {ticket.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
