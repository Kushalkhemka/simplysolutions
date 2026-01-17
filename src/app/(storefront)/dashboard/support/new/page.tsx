'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Order {
    id: string;
    order_number: string;
    created_at: string;
}

const categories = [
    { value: 'order_issue', label: 'Order Issue', description: 'Problems with your order or delivery' },
    { value: 'license_issue', label: 'License Issue', description: 'License activation or installation problems' },
    { value: 'payment', label: 'Payment', description: 'Payment or refund related queries' },
    { value: 'technical', label: 'Technical', description: 'Technical support and troubleshooting' },
    { value: 'other', label: 'Other', description: 'General inquiries' },
];

const priorities = [
    { value: 'low', label: 'Low', description: 'General question, no urgency' },
    { value: 'medium', label: 'Medium', description: 'Need help but not urgent' },
    { value: 'high', label: 'High', description: 'Important issue affecting work' },
    { value: 'urgent', label: 'Urgent', description: 'Critical issue, needs immediate attention' },
];

export default function NewTicketPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [formData, setFormData] = useState({
        subject: '',
        category: 'order_issue',
        priority: 'medium',
        order_id: '',
        message: '',
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders?limit=10');
            const data = await res.json();
            if (data.success) {
                setOrders(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch orders');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim()) {
            toast.error('Please enter a subject');
            return;
        }
        if (!formData.message.trim()) {
            toast.error('Please describe your issue');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Ticket ${data.data.ticket_number} created successfully!`);
                router.push(`/dashboard/support/${data.data.id}`);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast.error('Failed to create ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/support">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Create Support Ticket</h1>
                    <p className="text-muted-foreground">We're here to help!</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject */}
                <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief description of your issue"
                        maxLength={200}
                    />
                </div>

                {/* Category */}
                <div>
                    <Label>Issue Category *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {categories.map(cat => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, category: cat.value })}
                                className={`p-3 rounded-lg border text-left transition-all ${formData.category === cat.value
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="font-medium text-sm">{cat.label}</div>
                                <div className="text-xs text-muted-foreground">{cat.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Related Order */}
                {(formData.category === 'order_issue' || formData.category === 'license_issue') && orders.length > 0 && (
                    <div>
                        <Label htmlFor="order">Related Order (Optional)</Label>
                        <select
                            id="order"
                            value={formData.order_id}
                            onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                            className="w-full mt-1 p-2 border rounded-md bg-background"
                        >
                            <option value="">Select an order...</option>
                            {orders.map(order => (
                                <option key={order.id} value={order.id}>
                                    {order.order_number} - {new Date(order.created_at).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Priority */}
                <div>
                    <Label>Priority</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {priorities.map(p => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, priority: p.value })}
                                className={`px-4 py-2 rounded-full text-sm transition-all ${formData.priority === p.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message */}
                <div>
                    <Label htmlFor="message">Describe Your Issue *</Label>
                    <textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Please provide as much detail as possible about your issue..."
                        className="w-full min-h-[150px] p-3 border rounded-md bg-background resize-none mt-1"
                        maxLength={5000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{formData.message.length}/5000 characters</p>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <Link href="/dashboard/support" className="flex-1">
                        <Button variant="outline" className="w-full" type="button">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Submit Ticket
                    </Button>
                </div>
            </form>
        </div>
    );
}
