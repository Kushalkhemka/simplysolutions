import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface UserOffer {
    id: string;
    user_id: string;
    offer_type: 'flash_deal' | 'price_slash' | 'bogo' | 'welcome_back';
    product_id: string | null;
    discount_value: number | null;
    original_price: number | null;
    offer_price: number | null;
    is_used: boolean;
    expires_at: string;
    used_at: string | null;
    created_at: string;
    product?: {
        name: string;
        slug: string;
        main_image_url: string | null;
    };
}

export interface WelcomeOffers {
    flashDeal: UserOffer | null;
    priceSlash: UserOffer | null;
    bogo: UserOffer | null;
    isFirstLogin: boolean;
    isReturningUser: boolean;
}

// Check if user qualifies for welcome offers (first login or returning after 30+ days)
export async function checkAndCreateWelcomeOffers(userId: string): Promise<WelcomeOffers | null> {
    const adminClient = createAdminClient();

    // Get user profile
    const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('last_login_at, created_at')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return null;
    }

    const isFirstLogin = !profile.last_login_at;
    const lastLogin = profile.last_login_at ? new Date(profile.last_login_at) : null;
    const daysSinceLastLogin = lastLogin
        ? Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const isReturningUser = !isFirstLogin && daysSinceLastLogin >= 30;

    // Check if user already has active offers
    const { data: existingOffers } = await adminClient
        .from('user_offers')
        .select('*')
        .eq('user_id', userId)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString());

    // Return existing offers if they exist
    if (existingOffers && existingOffers.length > 0) {
        const flashDeal = existingOffers.find(o => o.offer_type === 'flash_deal') || null;
        const priceSlash = existingOffers.find(o => o.offer_type === 'price_slash') || null;
        const bogo = existingOffers.find(o => o.offer_type === 'bogo') || null;

        return {
            flashDeal,
            priceSlash,
            bogo,
            isFirstLogin,
            isReturningUser,
        };
    }

    // Only create new offers for first-time or returning users
    if (!isFirstLogin && !isReturningUser) {
        return null;
    }

    // Find Windows 11 Pro product for flash deal (exclude combo packs)
    const { data: windows11Pro } = await adminClient
        .from('products')
        .select('id, price, name, slug, main_image_url')
        .ilike('name', '%windows 11%pro%')
        .not('name', 'ilike', '%combo%')
        .eq('is_active', true)
        .limit(1)
        .single();

    const now = new Date();
    const flash15Mins = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
    const offer12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

    const offersToCreate: any[] = [];

    // Flash Deal: Windows 11 Pro at ₹499 for 15 minutes
    if (windows11Pro) {
        offersToCreate.push({
            user_id: userId,
            offer_type: 'flash_deal',
            product_id: windows11Pro.id,
            original_price: windows11Pro.price,
            offer_price: 499,
            discount_value: windows11Pro.price - 499,
            is_used: false,
            expires_at: flash15Mins.toISOString(),
        });
    }

    // Price Slash: 20% off any product (one-time use, valid for 12 hours)
    offersToCreate.push({
        user_id: userId,
        offer_type: 'price_slash',
        product_id: null, // Can be used on any product
        discount_value: 20, // 20% discount
        is_used: false,
        expires_at: offer12Hours.toISOString(),
    });

    // BOGO: Buy one get one free (valid for 12 hours, max ₹1000)
    offersToCreate.push({
        user_id: userId,
        offer_type: 'bogo',
        product_id: null, // Can be used on any product
        discount_value: 1000, // Max discount cap
        is_used: false,
        expires_at: offer12Hours.toISOString(),
    });

    // Create offers
    if (offersToCreate.length > 0) {
        const { data: createdOffers, error: createError } = await adminClient
            .from('user_offers')
            .insert(offersToCreate)
            .select();

        if (createError) {
            console.error('Error creating offers:', createError);
            return null;
        }

        const flashDeal = createdOffers?.find(o => o.offer_type === 'flash_deal') || null;
        const priceSlash = createdOffers?.find(o => o.offer_type === 'price_slash') || null;
        const bogo = createdOffers?.find(o => o.offer_type === 'bogo') || null;

        // Add product info to flash deal
        if (flashDeal && windows11Pro) {
            (flashDeal as any).product = {
                name: windows11Pro.name,
                slug: windows11Pro.slug,
                main_image_url: windows11Pro.main_image_url,
            };
        }

        return {
            flashDeal,
            priceSlash,
            bogo,
            isFirstLogin,
            isReturningUser,
        };
    }

    return null;
}

// Get active offers for a user
export async function getActiveOffers(userId: string): Promise<UserOffer[]> {
    const supabase = await createClient();

    const { data: offers, error } = await supabase
        .from('user_offers')
        .select(`
            *,
            product:products(name, slug, main_image_url)
        `)
        .eq('user_id', userId)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

    if (error) {
        console.error('Error fetching offers:', error);
        return [];
    }

    return offers || [];
}

// Mark an offer as used
export async function useOffer(offerId: string, userId: string): Promise<boolean> {
    const adminClient = createAdminClient();

    const { error } = await adminClient
        .from('user_offers')
        .update({
            is_used: true,
            used_at: new Date().toISOString(),
        })
        .eq('id', offerId)
        .eq('user_id', userId)
        .eq('is_used', false);

    if (error) {
        console.error('Error using offer:', error);
        return false;
    }

    return true;
}

// Calculate discounted price based on offer
export function calculateOfferPrice(
    originalPrice: number,
    offer: UserOffer
): number {
    if (offer.offer_type === 'flash_deal' && offer.offer_price) {
        return offer.offer_price;
    }

    if (offer.offer_type === 'price_slash' && offer.discount_value) {
        return Math.round(originalPrice * (1 - offer.discount_value / 100));
    }

    return originalPrice;
}
