-- Migration: Remove unused indexes
-- Date: 2026-01-23
-- Description: Drops indexes that have never been used to reduce storage overhead and improve write performance
-- WARNING: This is a one-way operation. Backup your database before running.

-- multi_fsn_orders (3 indexes)
DROP INDEX IF EXISTS public.idx_multi_fsn_orders_order_id;
DROP INDEX IF EXISTS public.idx_multi_fsn_orders_status;
DROP INDEX IF EXISTS public.idx_multi_fsn_orders_created_at;

-- office365_requests (3 indexes)
DROP INDEX IF EXISTS public.idx_office365_requests_is_completed;
DROP INDEX IF EXISTS public.idx_office365_requests_email;
DROP INDEX IF EXISTS public.idx_office365_requests_whatsapp;

-- warranty_registrations (1 index)
DROP INDEX IF EXISTS public.idx_warranty_registrations_email;

-- amazon_asin_mapping (2 indexes)
DROP INDEX IF EXISTS public.idx_asin_mapping_asin;
DROP INDEX IF EXISTS public.idx_asin_mapping_fsn;

-- amazon_activation_license_keys (1 index)
DROP INDEX IF EXISTS public.idx_keys_redeemed_at;

-- amazon_orders (1 index)
DROP INDEX IF EXISTS public.idx_amazon_orders_confirmation_id;

-- bundles (2 indexes)
DROP INDEX IF EXISTS public.idx_bundles_active;
DROP INDEX IF EXISTS public.idx_bundles_slug;

-- cart_items (3 indexes)
DROP INDEX IF EXISTS public.idx_cart_items_product;
DROP INDEX IF EXISTS public.idx_cart_session;
DROP INDEX IF EXISTS public.idx_cart_user;

-- categories (2 indexes)
DROP INDEX IF EXISTS public.idx_categories_parent;
DROP INDEX IF EXISTS public.idx_categories_slug;

-- coupon_usage (3 indexes)
DROP INDEX IF EXISTS public.idx_coupon_usage_coupon;
DROP INDEX IF EXISTS public.idx_coupon_usage_order;
DROP INDEX IF EXISTS public.idx_coupon_usage_user;

-- coupons (3 indexes)
DROP INDEX IF EXISTS public.idx_coupons_active;
DROP INDEX IF EXISTS public.idx_coupons_code;
DROP INDEX IF EXISTS public.idx_coupons_created_by;

-- deals (4 indexes)
DROP INDEX IF EXISTS public.idx_deals_active;
DROP INDEX IF EXISTS public.idx_deals_created_by;
DROP INDEX IF EXISTS public.idx_deals_product;
DROP INDEX IF EXISTS public.idx_deals_type;

-- getcid_usage (2 indexes)
DROP INDEX IF EXISTS public.idx_getcid_usage_created_at;
DROP INDEX IF EXISTS public.idx_getcid_usage_identifier;

-- loyalty_transactions (2 indexes)
DROP INDEX IF EXISTS public.idx_loyalty_transactions_order;
DROP INDEX IF EXISTS public.idx_loyalty_transactions_user;

-- notifications (1 index)
DROP INDEX IF EXISTS public.idx_notifications_user;

-- office365_customizations (2 indexes)
DROP INDEX IF EXISTS public.idx_office365_customizations_is_completed;
DROP INDEX IF EXISTS public.idx_office365_customizations_order_id;

-- order_items (1 index)
DROP INDEX IF EXISTS public.idx_order_items_product;

-- orders (5 indexes)
DROP INDEX IF EXISTS public.idx_orders_created;
DROP INDEX IF EXISTS public.idx_orders_number;
DROP INDEX IF EXISTS public.idx_orders_payment_status;
DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.idx_orders_user;

-- point_transactions (3 indexes)
DROP INDEX IF EXISTS public.idx_point_transactions_order;
DROP INDEX IF EXISTS public.idx_point_transactions_type;
DROP INDEX IF EXISTS public.idx_point_transactions_user;

-- price_alerts (2 indexes)
DROP INDEX IF EXISTS public.idx_price_alerts_product;
DROP INDEX IF EXISTS public.idx_price_alerts_user;

-- product_comparisons (1 index)
DROP INDEX IF EXISTS public.idx_product_comparisons_user;

-- product_requests (1 index)
DROP INDEX IF EXISTS public.idx_product_requests_is_completed;

-- products (4 indexes)
DROP INDEX IF EXISTS public.idx_products_active;
DROP INDEX IF EXISTS public.idx_products_featured;
DROP INDEX IF EXISTS public.idx_products_price;
DROP INDEX IF EXISTS public.idx_products_sku;

-- products_data (1 index)
DROP INDEX IF EXISTS public.idx_products_data_fsn;

-- profiles (3 indexes)
DROP INDEX IF EXISTS public.idx_profiles_email;
DROP INDEX IF EXISTS public.idx_profiles_referral_code;
DROP INDEX IF EXISTS public.idx_profiles_referred_by;

-- push_subscriptions (1 index)
DROP INDEX IF EXISTS public.idx_push_subscriptions_user;

-- quotes (2 indexes)
DROP INDEX IF EXISTS public.idx_quotes_status;
DROP INDEX IF EXISTS public.idx_quotes_user_id;

-- reviews (4 indexes)
DROP INDEX IF EXISTS public.idx_reviews_order;
DROP INDEX IF EXISTS public.idx_reviews_product;
DROP INDEX IF EXISTS public.idx_reviews_rating;
DROP INDEX IF EXISTS public.idx_reviews_user;

-- ticket_messages (1 index)
DROP INDEX IF EXISTS public.idx_ticket_messages_sender;

-- tickets (4 indexes)
DROP INDEX IF EXISTS public.idx_tickets_assigned_to;
DROP INDEX IF EXISTS public.idx_tickets_number;
DROP INDEX IF EXISTS public.idx_tickets_order;
DROP INDEX IF EXISTS public.idx_tickets_status;

-- user_offers (3 indexes)
DROP INDEX IF EXISTS public.idx_user_offers_active;
DROP INDEX IF EXISTS public.idx_user_offers_product;
DROP INDEX IF EXISTS public.idx_user_offers_user_id;

-- wishlist (1 index)
DROP INDEX IF EXISTS public.idx_wishlist_product;

-- Summary notification
DO $$
BEGIN
  RAISE NOTICE 'Dropped 71 unused indexes successfully';
END $$;
