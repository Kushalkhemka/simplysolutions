-- =====================================================
-- SimplySolutions Feature Expansion - Database Migration
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE UPDATES
-- =====================================================

-- Add GSTN and business fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gstn VARCHAR(15);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'individual'; -- 'individual' | 'business'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Add points and rewards system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifetime_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'bronze'; -- 'bronze', 'silver', 'gold', 'platinum'

-- Add preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'INR';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- =====================================================
-- 2. ORDERS TABLE UPDATES
-- =====================================================

-- Add GST breakdown fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS igst_amount DECIMAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_gstn VARCHAR(15);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_business_name TEXT;

-- Add gift order fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_recipient_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_recipient_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_message TEXT;

-- Add points and currency
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- =====================================================
-- 3. PRODUCTS TABLE UPDATE
-- =====================================================

-- Add installation guide URL (if not already added)
ALTER TABLE products ADD COLUMN IF NOT EXISTS installation_guide_url TEXT;

-- =====================================================
-- 4. USER OFFERS TABLE (Welcome/Return offers)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    offer_type TEXT NOT NULL CHECK (offer_type IN ('flash_deal', 'price_slash', 'bogo', 'welcome_back')),
    product_id UUID REFERENCES products(id),
    discount_value DECIMAL,
    original_price DECIMAL,
    offer_price DECIMAL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_offers_user_id ON user_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_offers_active ON user_offers(user_id, is_used, expires_at);

-- =====================================================
-- 5. QUOTES TABLE (B2B Bulk Orders)
-- =====================================================

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'sent', 'accepted', 'rejected', 'expired')),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    gstn VARCHAR(15),
    products JSONB NOT NULL,
    total_quantity INTEGER NOT NULL,
    notes TEXT,
    admin_notes TEXT,
    quoted_amount DECIMAL,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- =====================================================
-- 6. BUNDLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    products JSONB NOT NULL, -- Array of {product_id, quantity}
    original_price DECIMAL NOT NULL,
    bundle_price DECIMAL NOT NULL,
    discount_percentage DECIMAL NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bundles_active ON bundles(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_bundles_slug ON bundles(slug);

-- =====================================================
-- 7. PRICE ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    target_price DECIMAL,
    current_price DECIMAL NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product ON price_alerts(product_id, is_active);

-- =====================================================
-- 8. POINT TRANSACTIONS TABLE (Gamification)
-- =====================================================

CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'review', 'referral', 'redemption', 'bonus', 'expired')),
    description TEXT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(user_id, type);

-- =====================================================
-- 9. PRODUCT COMPARISONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id TEXT,
    product_ids UUID[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_comparisons_user ON product_comparisons(user_id);

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE user_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_comparisons ENABLE ROW LEVEL SECURITY;

-- User offers: Users can read their own, admin can read all
CREATE POLICY "Users can view own offers" ON user_offers
    FOR SELECT USING (auth.uid() = user_id);

-- Quotes: Users can read their own, admin can read all
CREATE POLICY "Users can view own quotes" ON quotes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create quotes" ON quotes
    FOR INSERT WITH CHECK (true);

-- Bundles: Everyone can read active bundles
CREATE POLICY "Everyone can view active bundles" ON bundles
    FOR SELECT USING (is_active = true);

-- Price alerts: Users can manage their own
CREATE POLICY "Users can view own price alerts" ON price_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create price alerts" ON price_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own price alerts" ON price_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Point transactions: Users can view their own
CREATE POLICY "Users can view own point transactions" ON point_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Product comparisons: Users can manage their own
CREATE POLICY "Users can view own comparisons" ON product_comparisons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create comparisons" ON product_comparisons
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Tables created/updated:';
    RAISE NOTICE '  - profiles (added GSTN, points, tier, preferences)';
    RAISE NOTICE '  - orders (added GST breakdown, gift fields)';
    RAISE NOTICE '  - products (added installation_guide_url)';
    RAISE NOTICE '  - user_offers (new)';
    RAISE NOTICE '  - quotes (new)';
    RAISE NOTICE '  - bundles (new)';
    RAISE NOTICE '  - price_alerts (new)';
    RAISE NOTICE '  - point_transactions (new)';
    RAISE NOTICE '  - product_comparisons (new)';
END $$;
