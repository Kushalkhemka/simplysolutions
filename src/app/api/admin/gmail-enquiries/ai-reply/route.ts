import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GEMINI_API_KEY = 'AIzaSyDycY1_oS7nIu4Qv2QW3_xlB7e-OPx0xHI';

const TEMPLATES = {
    tech_support: `Dear [BUYER_NAME],

For quick assistance with this issue, please contact our technical support team on WhatsApp at 8178848830 (messages only; calls are not supported).

Our WhatsApp support includes automated chatbot assistance for instant replies, followed by manual support from our technical team if required. You may also request your license directly from technical support through this channel.

Additionally, you can find the email copy shared with you in Amazon Buyer–Seller Messaging at amazon.in/message for installation/activation instructions. If the issue persists, you may share the error screenshot via Amazon Buyer–Seller Messaging, and our team will review and respond accordingly.

Thank you for your cooperation.
CODEKEYS`,

    delivery: `Dear [BUYER_NAME],

We would like to inform you that your order has been successfully delivered to your Amazon-registered email address within 1 hour of your purchase time. You can also access a copy of the same by visiting Amazon Messaging Center at amazon.in/msg 

Thanks & Regards
CODEKEYS`,

    cancellation: `Dear [BUYER_NAME],

Thank you for contacting us regarding your order [ORDER_ID].

We would like to clearly inform you that this order was successfully delivered via Digital Delivery. As this product falls under the software category, cancellations or refunds are strictly not permitted once delivery is completed, in accordance with Amazon's Policies and Guidelines. 

Please note that all software products are non-returnable, non-refundable, and non-cancellable after delivery, irrespective of usage status or activation.

If you are experiencing any technical issues, activation errors, or installation difficulties, you may contact our technical support team on WhatsApp at 8178848830 (messages only; calls are not supported). Our support team will assist you with troubleshooting and activation guidance.

We appreciate your understanding and cooperation.

Regards,
CODEKEYS`,
};

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { customerMessage, customerName, orderId, product, reason, category } = body;

        if (!customerMessage) {
            return NextResponse.json({ error: 'Missing customerMessage' }, { status: 400 });
        }

        const systemPrompt = `You are a customer support representative for CODEKEYS, an Amazon seller that sells digital software licenses (Microsoft Office 365, Windows 10/11 Pro keys, AutoCAD, etc.). 

Your task is to generate a professional reply to the customer's enquiry using one of the available templates as a base, adapting it to the specific situation.

AVAILABLE TEMPLATES:

1. TECH SUPPORT (for activation issues, key errors, installation problems):
${TEMPLATES.tech_support}

2. DELIVERY (for delivery/shipping status queries):
${TEMPLATES.delivery}

3. CANCELLATION (for refund/cancellation requests):
${TEMPLATES.cancellation}

IMPORTANT RULES:
- Replace [BUYER_NAME] with the customer's actual name
- Replace [ORDER_ID] with the actual order ID
- If customer claims the product is pirated, fake, counterfeit, or non-genuine: ALWAYS ask them to share proof via a screenshot through Amazon Buyer-Seller Messaging. Politely state that your products are 100% genuine and sourced from authorized channels.
- NEVER agree to a refund, replacement, or compensation. Do NOT make any commitments or promises on behalf of the seller. For refund/cancellation requests, redirect the customer to the tech support team (WhatsApp 8178848830) using the TECH SUPPORT template. Ask the customer to share a screenshot or proof of their claim via Amazon Buyer-Seller Messaging for review by the team.
- Keep the response professional, concise, and empathetic
- Do not add any markdown formatting
- Do not add any sign-off or signature at the end of the reply
- Respond ONLY with the email reply text, nothing else (no explanations, no "Here's the reply:", etc.)`;

        const userPrompt = `Customer Name: ${customerName || 'Customer'}
Order ID: ${orderId || 'N/A'}
Product: ${product || 'Digital Software License'}
Category: ${category || 'general'}
Reason: ${reason || 'Not specified'}

Customer's Message:
${customerMessage}

Generate an appropriate reply using the most suitable template. Adapt it based on the customer's specific issue.`;

        // Call Gemini API
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
                    ],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 1024,
                    },
                }),
            }
        );

        const geminiData = await geminiRes.json();

        if (geminiData.error) {
            throw new Error(geminiData.error.message || 'Gemini API error');
        }

        const aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return NextResponse.json({ success: true, reply: aiReply.trim() });
    } catch (error) {
        console.error('AI reply generation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate AI reply' },
            { status: 500 }
        );
    }
}
