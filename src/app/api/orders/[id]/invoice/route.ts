import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/orders/[id]/invoice - Generate and download invoice PDF
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login to download invoice');
        }

        // Get order with items
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    id,
                    product_name,
                    product_sku,
                    quantity,
                    unit_price,
                    total_price
                )
            `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !order) {
            return errorResponse('Order not found', 404);
        }

        // Only allow invoice for paid orders
        if (order.payment_status !== 'completed') {
            return errorResponse('Invoice is only available for completed payments', 400);
        }

        // Parse billing address
        const address = order.billing_address || {};

        // Generate HTML invoice
        const invoiceHtml = generateInvoiceHtml(order, address);

        // Return as HTML that can be printed to PDF
        return new Response(invoiceHtml, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="Invoice-${order.order_number}.html"`,
            },
        });
    } catch (error) {
        console.error('Invoice generation error:', error);
        return errorResponse('Failed to generate invoice', 500);
    }
}

function generateInvoiceHtml(order: any, address: any): string {
    const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    const items = order.items || [];
    const hasGstn = !!order.billing_gstn;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${order.order_number}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 14px; 
            line-height: 1.6; 
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f97316;
        }
        .company-info h1 {
            font-size: 28px;
            color: #f97316;
            margin-bottom: 5px;
        }
        .company-info p {
            color: #666;
            font-size: 13px;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h2 {
            font-size: 32px;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .invoice-title .invoice-number {
            font-size: 16px;
            color: #666;
            margin-top: 5px;
        }
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .billing-info, .invoice-info {
            flex: 1;
        }
        .billing-info h3, .invoice-info h3 {
            font-size: 14px;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        .billing-info p, .invoice-info p {
            margin-bottom: 4px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background: #f97316;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        .items-table th:last-child {
            text-align: right;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        .items-table td:last-child {
            text-align: right;
            font-weight: 500;
        }
        .items-table tbody tr:hover {
            background: #f9f9f9;
        }
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        .totals-table {
            width: 300px;
        }
        .totals-table tr td {
            padding: 8px 0;
        }
        .totals-table tr td:last-child {
            text-align: right;
            font-weight: 500;
        }
        .totals-table .total-row {
            border-top: 2px solid #333;
            font-size: 18px;
            font-weight: bold;
        }
        .totals-table .total-row td {
            padding-top: 12px;
        }
        .discount-row td {
            color: #16a34a;
        }
        .footer {
            border-top: 1px solid #eee;
            padding-top: 20px;
            text-align: center;
            color: #888;
            font-size: 12px;
        }
        .payment-info {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .payment-info h4 {
            color: #16a34a;
            margin-bottom: 8px;
        }
        .gstn-info {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .gstn-info h4 {
            color: #d97706;
            margin-bottom: 8px;
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f97316;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(249, 115, 22, 0.3);
        }
        .print-btn:hover {
            background: #ea580c;
        }
        @media print {
            body { background: white; padding: 0; }
            .invoice-container { box-shadow: none; padding: 20px; }
            .print-btn { display: none; }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Print / Download PDF</button>
    
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <h1>SimplySolutions</h1>
                <p>Genuine Software Licenses</p>
                <p>Delhi, India</p>
                <p>support@simplysolutions.co.in</p>
            </div>
            <div class="invoice-title">
                <h2>${hasGstn ? 'Tax Invoice' : 'Invoice'}</h2>
                <p class="invoice-number">${order.order_number}</p>
            </div>
        </div>

        <div class="invoice-details">
            <div class="billing-info">
                <h3>Bill To</h3>
                <p><strong>${order.billing_name}</strong></p>
                <p>${order.billing_email}</p>
                ${order.billing_phone ? `<p>${order.billing_phone}</p>` : ''}
                ${address.line1 ? `<p>${address.line1}</p>` : ''}
                ${address.line2 ? `<p>${address.line2}</p>` : ''}
                ${address.city || address.state || address.postalCode ? `<p>${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''} ${address.postalCode || ''}</p>` : ''}
            </div>
            <div class="invoice-info">
                <h3>Invoice Details</h3>
                <p><strong>Invoice Date:</strong> ${formatDate(order.created_at)}</p>
                <p><strong>Payment Date:</strong> ${order.paid_at ? formatDate(order.paid_at) : 'Pending'}</p>
                <p><strong>Payment ID:</strong> ${order.razorpay_payment_id || 'N/A'}</p>
                <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">PAID</span></p>
            </div>
        </div>

        ${order.billing_gstn ? `
        <div class="gstn-info">
            <h4>GST Details</h4>
            <p><strong>Customer GSTN:</strong> ${order.billing_gstn}</p>
        </div>
        ` : ''}

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Description</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item: any) => `
                <tr>
                    <td>${item.product_name}</td>
                    <td>${item.product_sku}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unit_price)}</td>
                    <td>${formatCurrency(item.total_price)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td>Subtotal</td>
                    <td>${formatCurrency(order.subtotal)}</td>
                </tr>
                ${order.discount_amount > 0 ? `
                <tr class="discount-row">
                    <td>Discount</td>
                    <td>-${formatCurrency(order.discount_amount)}</td>
                </tr>
                ` : ''}
                ${order.coupon_discount > 0 ? `
                <tr class="discount-row">
                    <td>Coupon (${order.coupon_code})</td>
                    <td>-${formatCurrency(order.coupon_discount)}</td>
                </tr>
                ` : ''}
                ${order.loyalty_points_used > 0 ? `
                <tr class="discount-row">
                    <td>Loyalty Points</td>
                    <td>-${formatCurrency(order.loyalty_points_used)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td>Total</td>
                    <td>${formatCurrency(order.total_amount)}</td>
                </tr>
            </table>
        </div>

        <div class="payment-info">
            <h4>✓ Payment Received</h4>
            <p>Thank you for your purchase! Your license keys have been delivered to your email and dashboard.</p>
        </div>

        <div class="footer">
            <p>This is a computer-generated invoice and does not require a signature.</p>
            <p>For support, contact us at support@simplysolutions.co.in</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} SimplySolutions. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}
