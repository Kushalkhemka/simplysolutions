import { NextResponse } from 'next/server';

// GET /api/push/vapid-key - Get VAPID public key for client
export async function GET() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    return NextResponse.json({ publicKey });
}
