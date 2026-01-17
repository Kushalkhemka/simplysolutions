-- ===========================================
-- SIMPLYSOLUTIONS DATABASE SCHEMA
-- Version: 1.0.0
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- 1. USER PROFILES
-- ===========================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id),
    wallet_balance DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- ===========================================
-- 2. CATEGORIES
-- ===========================================
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    meta_title TEXT,
    meta_description TEXT,
    product_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

-- ===========================================
-- 3. PRODUCTS
-- ===========================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    brand TEXT DEFAULT 'Microsoft',
    manufacturer TEXT DEFAULT 'Microsoft Corporation India',
    model_name TEXT,
    model_number TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    sale_start_at TIMESTAMPTZ,
    sale_end_at TIMESTAMPTZ,
    
    -- Images
    main_image_url TEXT,
    image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Product details
    bullet_points TEXT[] DEFAULT ARRAY[]::TEXT[],
    keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    specifications JSONB DEFAULT '{}'::JSONB,
    platform TEXT[] DEFAULT ARRAY[]::TEXT[],
    operating_systems TEXT[] DEFAULT ARRAY[]::TEXT[],
    license_duration TEXT DEFAULT 'lifetime',
    max_devices INT DEFAULT 1,
    number_of_licenses INT DEFAULT 1,
    delivery_info TEXT DEFAULT 'Instant digital delivery via email',
    edition TEXT,
    subscription_term TEXT,
    
    -- Status flags
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    
    -- Inventory
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    allow_backorder BOOLEAN DEFAULT FALSE,
    
    -- Ratings
    avg_rating DECIMAL(2,1) DEFAULT 0,
    review_count INT DEFAULT 0,
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT[],
    
    -- Analytics
    view_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_price ON public.products(price);

-- ===========================================
-- 4. LICENSE KEYS INVENTORY
-- ===========================================
CREATE TABLE public.license_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    license_key TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'expired', 'revoked')),
    order_id UUID,
    order_item_id UUID,
    reserved_at TIMESTAMPTZ,
    reserved_until TIMESTAMPTZ,
    sold_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_license_keys_product ON public.license_keys(product_id);
CREATE INDEX idx_license_keys_status ON public.license_keys(status);
CREATE INDEX idx_license_keys_order ON public.license_keys(order_id);

-- ===========================================
-- 5. ORDERS
-- ===========================================
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'payment_pending', 'paid', 
        'delivering', 'delivered', 'cancelled', 'refunded', 'failed'
    )),
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    coupon_discount DECIMAL(10,2) DEFAULT 0,
    wallet_used DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Coupon
    coupon_id UUID,
    coupon_code TEXT,
    
    -- Billing
    billing_name TEXT NOT NULL,
    billing_email TEXT NOT NULL,
    billing_phone TEXT,
    billing_address JSONB,
    
    -- Payment
    payment_method TEXT DEFAULT 'razorpay',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'
    )),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    payment_data JSONB,
    paid_at TIMESTAMPTZ,
    
    -- Delivery
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN (
        'pending', 'processing', 'sent', 'delivered', 'failed'
    )),
    delivered_at TIMESTAMPTZ,
    delivery_email_sent BOOLEAN DEFAULT FALSE,
    
    -- Referral/Affiliate
    referral_code TEXT,
    affiliate_id UUID,
    
    -- Notes
    customer_notes TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- ===========================================
-- 6. ORDER ITEMS
-- ===========================================
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    
    -- Snapshot of product at time of order
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    product_image TEXT,
    
    -- Pricing
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- License keys assigned
    license_keys TEXT[] DEFAULT ARRAY[]::TEXT[],
    license_key_ids UUID[] DEFAULT ARRAY[]::UUID[],
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'refunded')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- ===========================================
-- 7. SHOPPING CART
-- ===========================================
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique product per user/session
    CONSTRAINT unique_user_product UNIQUE (user_id, product_id),
    CONSTRAINT unique_session_product UNIQUE (session_id, product_id),
    
    -- Either user_id or session_id must be present
    CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX idx_cart_user ON public.cart_items(user_id);
CREATE INDEX idx_cart_session ON public.cart_items(session_id);

-- ===========================================
-- 8. WISHLIST
-- ===========================================
CREATE TABLE public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user ON public.wishlist(user_id);

-- ===========================================
-- 9. REVIEWS
-- ===========================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    pros TEXT[],
    cons TEXT[],
    
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    
    admin_response TEXT,
    admin_response_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, user_id)
);

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- ===========================================
-- 10. COUPONS
-- ===========================================
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Discount
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount_amount DECIMAL(10,2),
    
    -- Conditions
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    min_items INT DEFAULT 1,
    
    -- Usage limits
    usage_limit INT,
    used_count INT DEFAULT 0,
    per_user_limit INT DEFAULT 1,
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active) WHERE is_active = TRUE;

-- ===========================================
-- 11. COUPON USAGE TRACKING
-- ===========================================
CREATE TABLE public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_applied DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user ON public.coupon_usage(user_id);

-- ===========================================
-- 12. DEALS (Lightning, Daily, Weekly)
-- ===========================================
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    deal_type TEXT DEFAULT 'lightning' CHECK (deal_type IN ('lightning', 'daily', 'weekly', 'flash', 'clearance')),
    title TEXT,
    description TEXT,
    
    -- Discount
    discount_percentage INT NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    deal_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    
    -- Quantity limits
    quantity_limit INT,
    quantity_sold INT DEFAULT 0,
    
    -- Time
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_product ON public.deals(product_id);
CREATE INDEX idx_deals_active ON public.deals(is_active, starts_at, ends_at);
CREATE INDEX idx_deals_type ON public.deals(deal_type);

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories: Anyone can read
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Products: Anyone can read active products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);

-- Cart: Users can manage their own cart
CREATE POLICY "Users can view own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id OR session_id IS NOT NULL);
CREATE POLICY "Users can insert cart items" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);
CREATE POLICY "Users can update own cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id OR session_id IS NOT NULL);
CREATE POLICY "Users can delete own cart items" ON public.cart_items FOR DELETE USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Wishlist: Users can manage their own wishlist
CREATE POLICY "Users can view own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert wishlist items" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist items" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- Orders: Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Order Items: Users can view their own order items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Reviews: Anyone can read, users can manage their own
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Coupons: Anyone can read active coupons
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- Deals: Anyone can read active deals
CREATE POLICY "Anyone can view active deals" ON public.deals FOR SELECT USING (is_active = true AND starts_at <= NOW() AND ends_at > NOW());

-- License keys: Only admins (handled via service role)
CREATE POLICY "No public access to license keys" ON public.license_keys FOR SELECT USING (false);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_license_keys_updated_at BEFORE UPDATE ON public.license_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, referral_code)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'REF' || substr(md5(random()::text), 1, 8)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update product stock
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products 
    SET stock_quantity = (
        SELECT COUNT(*) FROM public.license_keys 
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
        AND status = 'available'
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for license key changes
CREATE TRIGGER update_stock_on_license_change
    AFTER INSERT OR UPDATE OR DELETE ON public.license_keys
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Function to update product rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products 
    SET 
        avg_rating = COALESCE((
            SELECT AVG(rating)::DECIMAL(2,1) FROM public.reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
            AND is_approved = true
        ), 0),
        review_count = (
            SELECT COUNT(*) FROM public.reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
            AND is_approved = true
        )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for review changes
CREATE TRIGGER update_rating_on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'SS' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger for order number generation
CREATE TRIGGER set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW 
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();
