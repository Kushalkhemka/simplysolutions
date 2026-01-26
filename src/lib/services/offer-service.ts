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

    // Fetch offer templates from database
    const { data: templates } = await adminClient
        .from('welcome_offer_templates')
        .select(`
            *,
            product:products(id, price, name, slug, main_image_url)
        `)
        .eq('is_active', true);

    if (!templates || templates.length === 0) {
        return null;
    }

    const now = new Date();
    const offersToCreate: any[] = [];

    for (const template of templates) {
        const expiresAt = new Date(now.getTime() + template.duration_hours * 60 * 60 * 1000);

        if (template.offer_type === 'flash_deal' && template.product) {
            offersToCreate.push({
                user_id: userId,
                offer_type: 'flash_deal',
                product_id: template.product.id,
                original_price: template.product.price,
                offer_price: template.special_price,
                discount_value: template.product.price - template.special_price,
                is_used: false,
                expires_at: expiresAt.toISOString(),
            });
        } else if (template.offer_type === 'price_slash') {
            offersToCreate.push({
                user_id: userId,
                offer_type: 'price_slash',
                product_id: null,
                discount_value: template.discount_value, // percentage
                is_used: false,
                expires_at: expiresAt.toISOString(),
            });
        } else if (template.offer_type === 'bogo') {
            offersToCreate.push({
                user_id: userId,
                offer_type: 'bogo',
                product_id: null,
                discount_value: template.max_discount_cap, // max cap
                is_used: false,
                expires_at: expiresAt.toISOString(),
            });
        }
    }

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

        // Add product info to flash deal from template
        if (flashDeal) {
            const flashTemplate = templates.find(t => t.offer_type === 'flash_deal');
            if (flashTemplate?.product) {
                (flashDeal as any).product = {
                    name: flashTemplate.product.name,
                    slug: flashTemplate.product.slug,
                    main_image_url: flashTemplate.product.main_image_url,
                };
            }
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
