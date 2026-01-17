import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export default async function AdminCustomersPage() {
    const supabase = await createClient();

    const { data: customers } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    // Get order counts per customer
    const { data: orderCounts } = await supabase
        .from('orders')
        .select('user_id')
        .eq('status', 'delivered');

    const orderCountMap = (orderCounts || []).reduce((acc: Record<string, number>, order: any) => {
        acc[order.user_id] = (acc[order.user_id] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Customers</h1>
                <p className="text-muted-foreground">View and manage customer accounts</p>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left p-4 font-medium">Customer</th>
                                <th className="text-left p-4 font-medium">Email</th>
                                <th className="text-center p-4 font-medium">Orders</th>
                                <th className="text-center p-4 font-medium">Role</th>
                                <th className="text-left p-4 font-medium">Joined</th>
                                <th className="text-left p-4 font-medium">Last Login</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {customers?.map((customer: any) => (
                                <tr key={customer.id} className="hover:bg-muted/30">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-sm font-medium text-primary">
                                                    {customer.full_name?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                            <span className="font-medium">{customer.full_name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{customer.email}</td>
                                    <td className="p-4 text-center">
                                        <span className="font-medium">{orderCountMap[customer.id] || 0}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'}>
                                            {customer.role}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {new Date(customer.created_at).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {customer.last_login_at
                                            ? new Date(customer.last_login_at).toLocaleDateString('en-IN')
                                            : 'Never'
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(!customers || customers.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No customers yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
