import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAndCreateWelcomeOffers, getActiveOffers } from '@/lib/services/offer-service';

// GET /api/offers - Get user's active offers
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const offers = await getActiveOffers(user.id);

        return NextResponse.json({
            success: true,
            data: {
                offers,
                flashDeal: offers.find(o => o.offer_type === 'flash_deal') || null,
                priceSlash: offers.find(o => o.offer_type === 'price_slash') || null,
                bogo: offers.find(o => o.offer_type === 'bogo') || null,
            },
        });
    } catch (error) {
        console.error('Get offers error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/offers - Check and create welcome offers (called on login)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const welcomeOffers = await checkAndCreateWelcomeOffers(user.id);

        if (!welcomeOffers) {
            return NextResponse.json({
                success: true,
                data: {
                    hasOffers: false,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                hasOffers: true,
                isFirstLogin: welcomeOffers.isFirstLogin,
                isReturningUser: welcomeOffers.isReturningUser,
                flashDeal: welcomeOffers.flashDeal,
                priceSlash: welcomeOffers.priceSlash,
                bogo: welcomeOffers.bogo,
            },
        });
    } catch (error) {
        console.error('Create offers error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
