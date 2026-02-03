/**
 * Abandoned Cart Email Template
 */

export function getAbandonedCartEmailHtml(data: {
    customerName?: string;
    items: Array<{
        name: string;
        price: number;
        imageUrl?: string;
    }>;
    cartUrl: string;
    reminderNumber: number;
}): string {
    const { customerName, items, cartUrl, reminderNumber } = data;

    const totalValue = items.reduce((sum, item) => sum + item.price, 0);

    const greeting = customerName ? `Hi ${customerName}` : 'Hi there';

    const subjectLines = [
        'You left something behind! 🛒',
        'Still interested? Your cart is waiting! ⏰',
        'Last chance! Complete your order now 🎯'
    ];

    const urgencyMessages = [
        'Your cart is waiting for you!',
        'Don\'t miss out on these great items!',
        'This is your last reminder - complete your order before items sell out!'
    ];

    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    ${item.imageUrl ? `
                        <img src="${item.imageUrl}" alt="${item.name}" 
                             style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
                    ` : ''}
                    <div>
                        <p style="margin: 0; font-weight: 500; color: #1a1a1a;">${item.name}</p>
                        <p style="margin: 4px 0 0; color: #16a34a; font-weight: 600;">₹${item.price.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subjectLines[Math.min(reminderNumber - 1, 2)]}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                    SimplySolutions
                </h1>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="padding: 40px 32px;">
                <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 22px;">
                    ${greeting}! 👋
                </h2>
                <p style="margin: 0 0 24px; color: #525252; font-size: 16px; line-height: 1.6;">
                    ${urgencyMessages[Math.min(reminderNumber - 1, 2)]}
                </p>
                
                <!-- Cart Items -->
                <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                    <thead>
                        <tr>
                            <th style="padding: 12px; background: #f9fafb; text-align: left; font-weight: 600; color: #374151;">
                                Your Cart (${items.length} item${items.length > 1 ? 's' : ''})
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="padding: 16px; background: #f9fafb;">
                                <p style="margin: 0; text-align: right; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                                    Total: ₹${totalValue.toLocaleString('en-IN')}
                                </p>
                            </td>
                        </tr>
                    </tfoot>
                </table>
                
                <!-- CTA Button -->
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td style="text-align: center; padding: 8px 0;">
                            <a href="${cartUrl}" 
                               style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                Complete Your Order →
                            </a>
                        </td>
                    </tr>
                </table>
                
                <p style="margin: 24px 0 0; color: #9ca3af; font-size: 14px; text-align: center;">
                    Questions? Reply to this email or contact us at support@simplysolutions.co.in
                </p>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="padding: 24px 32px; background: #f9fafb; border-top: 1px solid #eee;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                    SimplySolutions | Genuine Software at Best Prices<br/>
                    <a href="https://simplysolutions.co.in" style="color: #2563eb; text-decoration: none;">simplysolutions.co.in</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

export function getAbandonedCartEmailSubject(reminderNumber: number): string {
    const subjects = [
        '🛒 You left items in your cart at SimplySolutions!',
        '⏰ Your cart is about to expire - Complete your order!',
        '🎯 Last chance! Your SimplySolutions cart is waiting'
    ];
    return subjects[Math.min(reminderNumber - 1, 2)];
}
