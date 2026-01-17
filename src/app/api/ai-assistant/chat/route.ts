import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are a helpful AI shopping assistant for SimplySolutions, a software license store. 

Your job is to:
1. Help customers find the right software products
2. Answer questions about Windows, Office, design software, and other products
3. Explain license types (lifetime, subscription, etc.)
4. Guide customers through the purchase process
5. Provide technical support for common activation issues

Products we sell include:
- Windows 10/11 Pro, Home, Enterprise licenses
- Microsoft Office 2016, 2019, 2021, 2024, and Microsoft 365
- AutoCAD (1-year, 3-year subscriptions)
- Adobe Acrobat Pro
- Canva Pro
- Gemini Pro AI

Be helpful, friendly, and concise. If you don't know something, say so honestly.
For complex technical issues, suggest contacting support@simplysolutions.com.`;

// POST /api/ai-assistant/chat - Chat with AI assistant
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const body = await request.json();
        const { message, history = [] } = body;

        if (!message || typeof message !== 'string') {
            return errorResponse('Message is required', 400);
        }

        if (!process.env.GEMINI_API_KEY) {
            return errorResponse('AI service not configured', 503);
        }

        // Build conversation history for Gemini
        const chatHistory = history.slice(-10).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        // Check for product-related queries and add context
        let productContext = '';
        const searchTerms = message.toLowerCase();
        if (searchTerms.includes('windows') ||
            searchTerms.includes('office') ||
            searchTerms.includes('price') ||
            searchTerms.includes('recommend')) {

            // Fetch relevant products
            const { data: products } = await supabase
                .from('products')
                .select('name, price, mrp, short_description, platform, license_duration')
                .eq('is_active', true)
                .limit(5);

            if (products && products.length > 0) {
                productContext = '\n\nRelevant products for this query:\n' +
                    products.map((p: any) =>
                        `- ${p.name}: ₹${p.price} (MRP: ₹${p.mrp}) - ${p.license_duration}`
                    ).join('\n');
            }
        }

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Start chat with history
        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: 'You are a shopping assistant. Remember these instructions: ' + SYSTEM_PROMPT }] },
                { role: 'model', parts: [{ text: 'I understand. I\'m your SimplySolutions shopping assistant. How can I help you today?' }] },
                ...chatHistory,
            ],
        });

        // Send message with product context if available
        const result = await chat.sendMessage(message + productContext);
        const response = await result.response;
        const assistantMessage = response.text() ||
            "I'm sorry, I couldn't generate a response. Please try again.";

        return successResponse({
            message: assistantMessage,
        });
    } catch (error: any) {
        console.error('AI Assistant error:', error);

        if (error?.message?.includes('API_KEY')) {
            return errorResponse('AI service not configured', 503);
        }

        return errorResponse('Failed to process your request', 500);
    }
}
