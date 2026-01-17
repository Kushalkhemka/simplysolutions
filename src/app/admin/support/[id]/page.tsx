'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Clock, User, Headset, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Message {
    id: string;
    sender_type: 'user' | 'admin';
    sender_id: string;
    message: string;
    is_internal: boolean;
    created_at: string;
    sender?: { full_name: string };
}

interface Ticket {
    id: string;
    ticket_number: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    updated_at: string;
    user?: { full_name: string; email: string; phone: string };
    order?: { order_number: string };
}

const statusOptions = ['open', 'in_progress', 'awaiting_reply', 'resolved', 'closed'];
const priorityOptions = ['low', 'medium', 'high', 'urgent'];

const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    awaiting_reply: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
};

export default function AdminTicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isInternal, setIsInternal] = useState(false);

    useEffect(() => {
        fetchTicket();
    }, [params.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchTicket = async () => {
        try {
            const res = await fetch(`/api/admin/tickets/${params.id}`);
            const data = await res.json();
            if (data.success) {
                setTicket(data.data.ticket);
                setMessages(data.data.messages);
            } else {
                toast.error('Ticket not found');
                router.push('/admin/support');
            }
        } catch (error) {
            toast.error('Failed to load ticket');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/admin/tickets/${params.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage, is_internal: isInternal }),
            });

            const data = await res.json();
            if (data.success) {
                setMessages([...messages, data.data]);
                setNewMessage('');
                setIsInternal(false);
                toast.success(isInternal ? 'Internal note added' : 'Reply sent');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast.error('Failed to send reply');
        } finally {
            setIsSending(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/tickets/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await res.json();
            if (data.success) {
                setTicket({ ...ticket!, status: newStatus });
                toast.success('Status updated');
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handlePriorityChange = async (newPriority: string) => {
        try {
            const res = await fetch(`/api/admin/tickets/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority }),
            });

            const data = await res.json();
            if (data.success) {
                setTicket({ ...ticket!, priority: newPriority });
                toast.success('Priority updated');
            }
        } catch (error) {
            toast.error('Failed to update priority');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-150px)]">
            {/* Messages Panel */}
            <div className="lg:col-span-2 flex flex-col border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex-shrink-0 p-4 border-b bg-muted/30">
                    <div className="flex items-start gap-4">
                        <Link href="/admin/support">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-mono text-muted-foreground">{ticket.ticket_number}</span>
                                <Badge className={statusColors[ticket.status]}>
                                    {ticket.status.replace('_', ' ')}
                                </Badge>
                            </div>
                            <h1 className="text-lg font-bold">{ticket.subject}</h1>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-4 ${msg.is_internal
                                        ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200'
                                        : msg.sender_type === 'admin'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {msg.sender_type === 'admin' ? (
                                        <Headset className="h-4 w-4" />
                                    ) : (
                                        <User className="h-4 w-4" />
                                    )}
                                    <span className="text-xs font-medium">
                                        {msg.sender?.full_name || (msg.sender_type === 'admin' ? 'Support Team' : 'Customer')}
                                    </span>
                                    {msg.is_internal && (
                                        <Badge variant="outline" className="text-xs">Internal</Badge>
                                    )}
                                    <span className="text-xs opacity-70">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="flex-shrink-0 p-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={isInternal}
                                onChange={(e) => setIsInternal(e.target.checked)}
                                className="rounded"
                            />
                            Internal Note (not visible to customer)
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isInternal ? "Add internal note..." : "Type your reply..."}
                            className={`flex-1 min-h-[80px] p-3 border rounded-lg bg-background resize-none ${isInternal ? 'border-yellow-300' : ''
                                }`}
                            disabled={isSending}
                        />
                        <Button type="submit" size="icon" className="h-[80px] w-12" disabled={isSending || !newMessage.trim()}>
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
                {/* Customer Info */}
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Customer</h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            <div className="text-muted-foreground">Name</div>
                            <div className="font-medium">{ticket.user?.full_name || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Email</div>
                            <div className="font-medium">{ticket.user?.email}</div>
                        </div>
                        {ticket.user?.phone && (
                            <div>
                                <div className="text-muted-foreground">Phone</div>
                                <div className="font-medium">{ticket.user.phone}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ticket Details */}
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Ticket Details</h3>
                    <div className="space-y-3">
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Status</div>
                            <select
                                value={ticket.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="w-full p-2 border rounded-md bg-background text-sm"
                            >
                                {statusOptions.map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Priority</div>
                            <select
                                value={ticket.priority}
                                onChange={(e) => handlePriorityChange(e.target.value)}
                                className="w-full p-2 border rounded-md bg-background text-sm"
                            >
                                {priorityOptions.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Category</div>
                            <div className="font-medium text-sm capitalize">{ticket.category.replace('_', ' ')}</div>
                        </div>
                        {ticket.order && (
                            <div>
                                <div className="text-sm text-muted-foreground">Related Order</div>
                                <Link href={`/admin/orders/${ticket.order.order_number}`} className="font-medium text-sm text-primary hover:underline">
                                    {ticket.order.order_number}
                                </Link>
                            </div>
                        )}
                        <div>
                            <div className="text-sm text-muted-foreground">Created</div>
                            <div className="font-medium text-sm">{new Date(ticket.created_at).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleStatusChange('resolved')}
                            disabled={ticket.status === 'resolved'}
                        >
                            Mark as Resolved
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleStatusChange('closed')}
                            disabled={ticket.status === 'closed'}
                        >
                            Close Ticket
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
