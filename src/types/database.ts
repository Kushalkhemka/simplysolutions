// Database types for Supabase
// These should be generated with: npx supabase gen types typescript

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    phone: string | null
                    avatar_url: string | null
                    role: 'customer' | 'admin' | 'super_admin'
                    referral_code: string | null
                    referred_by: string | null
                    wallet_balance: number
                    is_active: boolean
                    email_verified: boolean
                    last_login_at: string | null
                    gstn: string | null
                    business_name: string | null
                    business_type: 'individual' | 'business' | null
                    billing_address: Json | null
                    points: number
                    lifetime_points: number
                    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
                    preferred_currency: string
                    preferred_language: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    role?: 'customer' | 'admin' | 'super_admin'
                    referral_code?: string | null
                    referred_by?: string | null
                    wallet_balance?: number
                    is_active?: boolean
                    email_verified?: boolean
                    last_login_at?: string | null
                    gstn?: string | null
                    business_name?: string | null
                    business_type?: 'individual' | 'business' | null
                    billing_address?: Json | null
                    points?: number
                    lifetime_points?: number
                    tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
                    preferred_currency?: string
                    preferred_language?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    role?: 'customer' | 'admin' | 'super_admin'
                    referral_code?: string | null
                    referred_by?: string | null
                    wallet_balance?: number
                    is_active?: boolean
                    email_verified?: boolean
                    last_login_at?: string | null
                    gstn?: string | null
                    business_name?: string | null
                    business_type?: 'individual' | 'business' | null
                    billing_address?: Json | null
                    points?: number
                    lifetime_points?: number
                    tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
                    preferred_currency?: string
                    preferred_language?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    image_url: string | null
                    icon: string | null
                    parent_id: string | null
                    display_order: number
                    is_active: boolean
                    is_featured: boolean
                    meta_title: string | null
                    meta_description: string | null
                    product_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    image_url?: string | null
                    icon?: string | null
                    parent_id?: string | null
                    display_order?: number
                    is_active?: boolean
                    is_featured?: boolean
                    meta_title?: string | null
                    meta_description?: string | null
                    product_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    image_url?: string | null
                    icon?: string | null
                    parent_id?: string | null
                    display_order?: number
                    is_active?: boolean
                    is_featured?: boolean
                    meta_title?: string | null
                    meta_description?: string | null
                    product_count?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    sku: string
                    name: string
                    slug: string
                    description: string | null
                    short_description: string | null
                    brand: string
                    manufacturer: string
                    model_name: string | null
                    model_number: string | null
                    category_id: string | null
                    price: number
                    mrp: number
                    cost_price: number | null
                    sale_price: number | null
                    sale_start_at: string | null
                    sale_end_at: string | null
                    main_image_url: string | null
                    image_urls: string[]
                    bullet_points: string[]
                    keywords: string[]
                    features: string[]
                    specifications: Json
                    platform: string[]
                    operating_systems: string[]
                    license_duration: string
                    max_devices: number
                    number_of_licenses: number
                    delivery_info: string
                    edition: string | null
                    subscription_term: string | null
                    is_active: boolean
                    is_featured: boolean
                    is_bestseller: boolean
                    is_new_arrival: boolean
                    stock_quantity: number
                    low_stock_threshold: number
                    allow_backorder: boolean
                    avg_rating: number
                    review_count: number
                    meta_title: string | null
                    meta_description: string | null
                    meta_keywords: string[] | null
                    view_count: number
                    sold_count: number
                    installation_guide_url: string | null
                    fsn: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    sku: string
                    name: string
                    slug: string
                    description?: string | null
                    short_description?: string | null
                    brand?: string
                    manufacturer?: string
                    model_name?: string | null
                    model_number?: string | null
                    category_id?: string | null
                    price: number
                    mrp: number
                    cost_price?: number | null
                    sale_price?: number | null
                    sale_start_at?: string | null
                    sale_end_at?: string | null
                    main_image_url?: string | null
                    image_urls?: string[]
                    bullet_points?: string[]
                    keywords?: string[]
                    features?: string[]
                    specifications?: Json
                    platform?: string[]
                    operating_systems?: string[]
                    license_duration?: string
                    max_devices?: number
                    number_of_licenses?: number
                    delivery_info?: string
                    edition?: string | null
                    subscription_term?: string | null
                    is_active?: boolean
                    is_featured?: boolean
                    is_bestseller?: boolean
                    is_new_arrival?: boolean
                    stock_quantity?: number
                    low_stock_threshold?: number
                    allow_backorder?: boolean
                    avg_rating?: number
                    review_count?: number
                    meta_title?: string | null
                    meta_description?: string | null
                    meta_keywords?: string[] | null
                    view_count?: number
                    sold_count?: number
                    installation_guide_url?: string | null
                    fsn?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    sku?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    short_description?: string | null
                    brand?: string
                    manufacturer?: string
                    model_name?: string | null
                    model_number?: string | null
                    category_id?: string | null
                    price?: number
                    mrp?: number
                    cost_price?: number | null
                    sale_price?: number | null
                    sale_start_at?: string | null
                    sale_end_at?: string | null
                    main_image_url?: string | null
                    image_urls?: string[]
                    bullet_points?: string[]
                    keywords?: string[]
                    features?: string[]
                    specifications?: Json
                    platform?: string[]
                    operating_systems?: string[]
                    license_duration?: string
                    max_devices?: number
                    number_of_licenses?: number
                    delivery_info?: string
                    edition?: string | null
                    subscription_term?: string | null
                    is_active?: boolean
                    is_featured?: boolean
                    is_bestseller?: boolean
                    is_new_arrival?: boolean
                    stock_quantity?: number
                    low_stock_threshold?: number
                    allow_backorder?: boolean
                    avg_rating?: number
                    review_count?: number
                    meta_title?: string | null
                    meta_description?: string | null
                    meta_keywords?: string[] | null
                    view_count?: number
                    sold_count?: number
                    installation_guide_url?: string | null
                    fsn?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            license_keys: {
                Row: {
                    id: string
                    product_id: string
                    license_key: string
                    status: 'available' | 'reserved' | 'sold' | 'expired' | 'revoked'
                    order_id: string | null
                    order_item_id: string | null
                    reserved_at: string | null
                    reserved_until: string | null
                    sold_at: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    license_key: string
                    status?: 'available' | 'reserved' | 'sold' | 'expired' | 'revoked'
                    order_id?: string | null
                    order_item_id?: string | null
                    reserved_at?: string | null
                    reserved_until?: string | null
                    sold_at?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    license_key?: string
                    status?: 'available' | 'reserved' | 'sold' | 'expired' | 'revoked'
                    order_id?: string | null
                    order_item_id?: string | null
                    reserved_at?: string | null
                    reserved_until?: string | null
                    sold_at?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    order_number: string
                    user_id: string
                    status: 'pending' | 'processing' | 'payment_pending' | 'paid' | 'delivering' | 'delivered' | 'cancelled' | 'refunded' | 'failed'
                    subtotal: number
                    discount_amount: number
                    coupon_discount: number
                    wallet_used: number
                    tax_amount: number
                    cgst_amount: number
                    sgst_amount: number
                    igst_amount: number
                    total_amount: number
                    coupon_id: string | null
                    coupon_code: string | null
                    billing_name: string
                    billing_email: string
                    billing_phone: string | null
                    billing_address: Json | null
                    billing_gstn: string | null
                    billing_business_name: string | null
                    payment_method: string
                    payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
                    razorpay_order_id: string | null
                    razorpay_payment_id: string | null
                    razorpay_signature: string | null
                    payment_data: Json | null
                    paid_at: string | null
                    delivery_status: 'pending' | 'processing' | 'sent' | 'delivered' | 'failed'
                    delivered_at: string | null
                    delivery_email_sent: boolean
                    referral_code: string | null
                    affiliate_id: string | null
                    is_gift: boolean
                    gift_recipient_email: string | null
                    gift_recipient_name: string | null
                    gift_message: string | null
                    customer_notes: string | null
                    admin_notes: string | null
                    points_earned: number
                    currency: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    order_number?: string
                    user_id: string
                    status?: 'pending' | 'processing' | 'payment_pending' | 'paid' | 'delivering' | 'delivered' | 'cancelled' | 'refunded' | 'failed'
                    subtotal: number
                    discount_amount?: number
                    coupon_discount?: number
                    wallet_used?: number
                    tax_amount?: number
                    cgst_amount?: number
                    sgst_amount?: number
                    igst_amount?: number
                    total_amount: number
                    coupon_id?: string | null
                    coupon_code?: string | null
                    billing_name: string
                    billing_email: string
                    billing_phone?: string | null
                    billing_address?: Json | null
                    billing_gstn?: string | null
                    billing_business_name?: string | null
                    payment_method?: string
                    payment_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
                    razorpay_order_id?: string | null
                    razorpay_payment_id?: string | null
                    razorpay_signature?: string | null
                    payment_data?: Json | null
                    paid_at?: string | null
                    delivery_status?: 'pending' | 'processing' | 'sent' | 'delivered' | 'failed'
                    delivered_at?: string | null
                    delivery_email_sent?: boolean
                    referral_code?: string | null
                    affiliate_id?: string | null
                    is_gift?: boolean
                    gift_recipient_email?: string | null
                    gift_recipient_name?: string | null
                    gift_message?: string | null
                    customer_notes?: string | null
                    admin_notes?: string | null
                    points_earned?: number
                    currency?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    order_number?: string
                    user_id?: string
                    status?: 'pending' | 'processing' | 'payment_pending' | 'paid' | 'delivering' | 'delivered' | 'cancelled' | 'refunded' | 'failed'
                    subtotal?: number
                    discount_amount?: number
                    coupon_discount?: number
                    wallet_used?: number
                    tax_amount?: number
                    cgst_amount?: number
                    sgst_amount?: number
                    igst_amount?: number
                    total_amount?: number
                    coupon_id?: string | null
                    coupon_code?: string | null
                    billing_name?: string
                    billing_email?: string
                    billing_phone?: string | null
                    billing_address?: Json | null
                    billing_gstn?: string | null
                    billing_business_name?: string | null
                    payment_method?: string
                    payment_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
                    razorpay_order_id?: string | null
                    razorpay_payment_id?: string | null
                    razorpay_signature?: string | null
                    payment_data?: Json | null
                    paid_at?: string | null
                    delivery_status?: 'pending' | 'processing' | 'sent' | 'delivered' | 'failed'
                    delivered_at?: string | null
                    delivery_email_sent?: boolean
                    referral_code?: string | null
                    affiliate_id?: string | null
                    is_gift?: boolean
                    gift_recipient_email?: string | null
                    gift_recipient_name?: string | null
                    gift_message?: string | null
                    customer_notes?: string | null
                    admin_notes?: string | null
                    points_earned?: number
                    currency?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    product_name: string
                    product_sku: string
                    product_image: string | null
                    quantity: number
                    unit_price: number
                    total_price: number
                    license_keys: string[]
                    license_key_ids: string[]
                    secret_codes: string[] | null
                    product_fsn: string | null
                    status: 'pending' | 'processing' | 'delivered' | 'refunded'
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    product_name: string
                    product_sku: string
                    product_image?: string | null
                    quantity?: number
                    unit_price: number
                    total_price: number
                    license_keys?: string[]
                    license_key_ids?: string[]
                    secret_codes?: string[] | null
                    product_fsn?: string | null
                    status?: 'pending' | 'processing' | 'delivered' | 'refunded'
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string
                    product_name?: string
                    product_sku?: string
                    product_image?: string | null
                    quantity?: number
                    unit_price?: number
                    total_price?: number
                    license_keys?: string[]
                    license_key_ids?: string[]
                    secret_codes?: string[] | null
                    product_fsn?: string | null
                    status?: 'pending' | 'processing' | 'delivered' | 'refunded'
                    created_at?: string
                }
            }
            cart_items: {
                Row: {
                    id: string
                    user_id: string | null
                    session_id: string | null
                    product_id: string
                    quantity: number
                    added_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    session_id?: string | null
                    product_id: string
                    quantity?: number
                    added_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    session_id?: string | null
                    product_id?: string
                    quantity?: number
                    added_at?: string
                    updated_at?: string
                }
            }
            wishlist: {
                Row: {
                    id: string
                    user_id: string
                    product_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    product_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    product_id?: string
                    created_at?: string
                }
            }
            reviews: {
                Row: {
                    id: string
                    product_id: string
                    user_id: string
                    order_id: string | null
                    rating: number
                    title: string | null
                    content: string | null
                    pros: string[] | null
                    cons: string[] | null
                    is_verified_purchase: boolean
                    is_approved: boolean
                    is_featured: boolean
                    helpful_count: number
                    not_helpful_count: number
                    admin_response: string | null
                    admin_response_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    user_id: string
                    order_id?: string | null
                    rating: number
                    title?: string | null
                    content?: string | null
                    pros?: string[] | null
                    cons?: string[] | null
                    is_verified_purchase?: boolean
                    is_approved?: boolean
                    is_featured?: boolean
                    helpful_count?: number
                    not_helpful_count?: number
                    admin_response?: string | null
                    admin_response_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    user_id?: string
                    order_id?: string | null
                    rating?: number
                    title?: string | null
                    content?: string | null
                    pros?: string[] | null
                    cons?: string[] | null
                    is_verified_purchase?: boolean
                    is_approved?: boolean
                    is_featured?: boolean
                    helpful_count?: number
                    not_helpful_count?: number
                    admin_response?: string | null
                    admin_response_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            coupons: {
                Row: {
                    id: string
                    code: string
                    description: string | null
                    discount_type: 'percentage' | 'fixed'
                    discount_value: number
                    max_discount_amount: number | null
                    min_order_amount: number
                    min_items: number
                    usage_limit: number | null
                    used_count: number
                    per_user_limit: number
                    valid_from: string
                    valid_until: string | null
                    is_active: boolean
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    code: string
                    description?: string | null
                    discount_type: 'percentage' | 'fixed'
                    discount_value: number
                    max_discount_amount?: number | null
                    min_order_amount?: number
                    min_items?: number
                    usage_limit?: number | null
                    used_count?: number
                    per_user_limit?: number
                    valid_from?: string
                    valid_until?: string | null
                    is_active?: boolean
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    code?: string
                    description?: string | null
                    discount_type?: 'percentage' | 'fixed'
                    discount_value?: number
                    max_discount_amount?: number | null
                    min_order_amount?: number
                    min_items?: number
                    usage_limit?: number | null
                    used_count?: number
                    per_user_limit?: number
                    valid_from?: string
                    valid_until?: string | null
                    is_active?: boolean
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            coupon_usage: {
                Row: {
                    id: string
                    coupon_id: string
                    user_id: string
                    order_id: string
                    discount_applied: number
                    used_at: string
                }
                Insert: {
                    id?: string
                    coupon_id: string
                    user_id: string
                    order_id: string
                    discount_applied: number
                    used_at?: string
                }
                Update: {
                    id?: string
                    coupon_id?: string
                    user_id?: string
                    order_id?: string
                    discount_applied?: number
                    used_at?: string
                }
            }
            deals: {
                Row: {
                    id: string
                    product_id: string
                    deal_type: 'lightning' | 'daily' | 'weekly' | 'flash' | 'clearance'
                    title: string | null
                    description: string | null
                    discount_percentage: number
                    deal_price: number
                    original_price: number
                    quantity_limit: number | null
                    quantity_sold: number
                    starts_at: string
                    ends_at: string
                    is_active: boolean
                    is_featured: boolean
                    display_order: number
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    deal_type?: 'lightning' | 'daily' | 'weekly' | 'flash' | 'clearance'
                    title?: string | null
                    description?: string | null
                    discount_percentage: number
                    deal_price: number
                    original_price: number
                    quantity_limit?: number | null
                    quantity_sold?: number
                    starts_at: string
                    ends_at: string
                    is_active?: boolean
                    is_featured?: boolean
                    display_order?: number
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    deal_type?: 'lightning' | 'daily' | 'weekly' | 'flash' | 'clearance'
                    title?: string | null
                    description?: string | null
                    discount_percentage?: number
                    deal_price?: number
                    original_price?: number
                    quantity_limit?: number | null
                    quantity_sold?: number
                    starts_at?: string
                    ends_at?: string
                    is_active?: boolean
                    is_featured?: boolean
                    display_order?: number
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            user_offers: {
                Row: {
                    id: string
                    user_id: string
                    offer_type: 'flash_deal' | 'price_slash' | 'bogo' | 'welcome_back'
                    product_id: string | null
                    discount_value: number | null
                    original_price: number | null
                    offer_price: number | null
                    is_used: boolean
                    expires_at: string
                    used_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    offer_type: 'flash_deal' | 'price_slash' | 'bogo' | 'welcome_back'
                    product_id?: string | null
                    discount_value?: number | null
                    original_price?: number | null
                    offer_price?: number | null
                    is_used?: boolean
                    expires_at: string
                    used_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    offer_type?: 'flash_deal' | 'price_slash' | 'bogo' | 'welcome_back'
                    product_id?: string | null
                    discount_value?: number | null
                    original_price?: number | null
                    offer_price?: number | null
                    is_used?: boolean
                    expires_at?: string
                    used_at?: string | null
                    created_at?: string
                }
            }
            quotes: {
                Row: {
                    id: string
                    user_id: string | null
                    status: 'pending' | 'reviewed' | 'sent' | 'accepted' | 'rejected' | 'expired'
                    company_name: string
                    contact_name: string
                    email: string
                    phone: string | null
                    gstn: string | null
                    products: Json
                    total_quantity: number
                    notes: string | null
                    admin_notes: string | null
                    quoted_amount: number | null
                    valid_until: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    status?: 'pending' | 'reviewed' | 'sent' | 'accepted' | 'rejected' | 'expired'
                    company_name: string
                    contact_name: string
                    email: string
                    phone?: string | null
                    gstn?: string | null
                    products: Json
                    total_quantity: number
                    notes?: string | null
                    admin_notes?: string | null
                    quoted_amount?: number | null
                    valid_until?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    status?: 'pending' | 'reviewed' | 'sent' | 'accepted' | 'rejected' | 'expired'
                    company_name?: string
                    contact_name?: string
                    email?: string
                    phone?: string | null
                    gstn?: string | null
                    products?: Json
                    total_quantity?: number
                    notes?: string | null
                    admin_notes?: string | null
                    quoted_amount?: number | null
                    valid_until?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            bundles: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    image_url: string | null
                    products: Json
                    original_price: number
                    bundle_price: number
                    discount_percentage: number
                    is_active: boolean
                    is_featured: boolean
                    display_order: number
                    valid_from: string | null
                    valid_until: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    image_url?: string | null
                    products: Json
                    original_price: number
                    bundle_price: number
                    discount_percentage: number
                    is_active?: boolean
                    is_featured?: boolean
                    display_order?: number
                    valid_from?: string | null
                    valid_until?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    image_url?: string | null
                    products?: Json
                    original_price?: number
                    bundle_price?: number
                    discount_percentage?: number
                    is_active?: boolean
                    is_featured?: boolean
                    display_order?: number
                    valid_from?: string | null
                    valid_until?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            price_alerts: {
                Row: {
                    id: string
                    user_id: string
                    product_id: string
                    target_price: number | null
                    current_price: number
                    is_active: boolean
                    notified_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    product_id: string
                    target_price?: number | null
                    current_price: number
                    is_active?: boolean
                    notified_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    product_id?: string
                    target_price?: number | null
                    current_price?: number
                    is_active?: boolean
                    notified_at?: string | null
                    created_at?: string
                }
            }
            point_transactions: {
                Row: {
                    id: string
                    user_id: string
                    points: number
                    type: 'purchase' | 'review' | 'referral' | 'redemption' | 'bonus' | 'expired'
                    description: string | null
                    order_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    points: number
                    type: 'purchase' | 'review' | 'referral' | 'redemption' | 'bonus' | 'expired'
                    description?: string | null
                    order_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    points?: number
                    type?: 'purchase' | 'review' | 'referral' | 'redemption' | 'bonus' | 'expired'
                    description?: string | null
                    order_id?: string | null
                    created_at?: string
                }
            }
            product_comparisons: {
                Row: {
                    id: string
                    user_id: string | null
                    session_id: string | null
                    product_ids: string[]
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    session_id?: string | null
                    product_ids: string[]
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    session_id?: string | null
                    product_ids?: string[]
                    created_at?: string
                    updated_at?: string
                }
            }
            tickets: {
                Row: {
                    id: string
                    user_id: string
                    ticket_number: string
                    subject: string
                    category: 'order_issue' | 'license_issue' | 'payment' | 'technical' | 'other'
                    priority: 'low' | 'medium' | 'high' | 'urgent'
                    status: 'open' | 'in_progress' | 'awaiting_reply' | 'resolved' | 'closed'
                    order_id: string | null
                    assigned_to: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    ticket_number?: string
                    subject: string
                    category: 'order_issue' | 'license_issue' | 'payment' | 'technical' | 'other'
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    status?: 'open' | 'in_progress' | 'awaiting_reply' | 'resolved' | 'closed'
                    order_id?: string | null
                    assigned_to?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    ticket_number?: string
                    subject?: string
                    category?: 'order_issue' | 'license_issue' | 'payment' | 'technical' | 'other'
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    status?: 'open' | 'in_progress' | 'awaiting_reply' | 'resolved' | 'closed'
                    order_id?: string | null
                    assigned_to?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            ticket_messages: {
                Row: {
                    id: string
                    ticket_id: string
                    sender_type: 'user' | 'admin'
                    sender_id: string
                    message: string
                    attachments: Json
                    is_internal: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    ticket_id: string
                    sender_type: 'user' | 'admin'
                    sender_id: string
                    message: string
                    attachments?: Json
                    is_internal?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    ticket_id?: string
                    sender_type?: 'user' | 'admin'
                    sender_id?: string
                    message?: string
                    attachments?: Json
                    is_internal?: boolean
                    created_at?: string
                }
            }
            push_subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    endpoint: string
                    keys: Json
                    is_active: boolean
                    user_agent: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    endpoint: string
                    keys: Json
                    is_active?: boolean
                    user_agent?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    endpoint?: string
                    keys?: Json
                    is_active?: boolean
                    user_agent?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string | null
                    type: 'order_update' | 'ticket_reply' | 'price_alert' | 'promotion' | 'system'
                    title: string
                    body: string
                    data: Json
                    is_read: boolean
                    sent_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    type: 'order_update' | 'ticket_reply' | 'price_alert' | 'promotion' | 'system'
                    title: string
                    body: string
                    data?: Json
                    is_read?: boolean
                    sent_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    type?: 'order_update' | 'ticket_reply' | 'price_alert' | 'promotion' | 'system'
                    title?: string
                    body?: string
                    data?: Json
                    is_read?: boolean
                    sent_at?: string
                }
            }
            amazon_secret_codes: {
                Row: {
                    id: string
                    secret_code: string
                    sku: string
                    license_key_id: string | null
                    is_redeemed: boolean
                    redeemed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    secret_code: string
                    sku: string
                    license_key_id?: string | null
                    is_redeemed?: boolean
                    redeemed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    secret_code?: string
                    sku?: string
                    license_key_id?: string | null
                    is_redeemed?: boolean
                    redeemed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            amazon_activation_license_keys: {
                Row: {
                    id: string
                    license_key: string
                    sku: string
                    product_name: string | null
                    product_image: string | null
                    download_url: string | null
                    is_redeemed: boolean
                    redeemed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    license_key: string
                    sku: string
                    product_name?: string | null
                    product_image?: string | null
                    download_url?: string | null
                    is_redeemed?: boolean
                    redeemed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    license_key?: string
                    sku?: string
                    product_name?: string | null
                    product_image?: string | null
                    download_url?: string | null
                    is_redeemed?: boolean
                    redeemed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
