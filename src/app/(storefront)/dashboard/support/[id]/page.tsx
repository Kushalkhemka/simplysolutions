'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Clock, User, Headset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Message {
    id: string;
    sender_type: 'user' | 'admin';
    sender_id: string;
    message: string;
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
    order?: { order_number: string };
}

const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    awaiting_reply: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
};

const categoryLabels: Record<string, string> = {
    order_issue: 'Order Issue',
    license_issue: 'License Issue',
    payment: 'Payment',
    technical: 'Technical',
    other: 'Other',
};

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

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
            const res = await fetch(`/api/tickets/${params.id}`);
            const data = await res.json();
            if (data.success) {
                setTicket(data.data.ticket);
                setMessages(data.data.messages);
            } else {
                toast.error('Ticket not found');
                router.push('/dashboard/support');
            }
        } catch (error) {
            toast.error('Failed to load ticket');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/tickets/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage }),
            });

            const data = await res.json();
            if (data.success) {
                setMessages([...messages, data.data]);
                setNewMessage('');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
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

    const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px]">
            {/* Header */}
            <div className="flex-shrink-0 pb-4 border-b">
                <div className="flex items-start gap-4">
                    <Link href="/dashboard/support">
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
                        <h1 className="text-xl font-bold">{ticket.subject}</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{categoryLabels[ticket.category] || ticket.category}</span>
                            {ticket.order && (
                                <>
                                    <span>•</span>
                                    <span>Order: {ticket.order.order_number}</span>
                                </>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-4 ${msg.sender_type === 'user'
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
                                    {msg.sender_type === 'admin' ? 'Support Team' : 'You'}
                                </span>
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
            {!isResolved ? (
                <form onSubmit={handleSendMessage} className="flex-shrink-0 pt-4 border-t">
                    <div className="flex gap-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 min-h-[80px] p-3 border rounded-lg bg-background resize-none"
                            disabled={isSending}
                        />
                        <Button type="submit" size="icon" className="h-[80px] w-12" disabled={isSending || !newMessage.trim()}>
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="flex-shrink-0 pt-4 border-t text-center text-muted-foreground">
                    <p>This ticket has been {ticket.status}.</p>
                    <Link href="/dashboard/support/new">
                        <Button variant="outline" className="mt-2">Create New Ticket</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
