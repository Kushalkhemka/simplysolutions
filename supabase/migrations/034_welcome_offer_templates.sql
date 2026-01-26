-- Migration: Create welcome offer templates table for admin-configurable offers
-- This allows admins to control BOGO, Price Slash, and Flash Deal configurations

CREATE TABLE IF NOT EXISTS welcome_offer_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_type TEXT NOT NULL UNIQUE, -- 'flash_deal' | 'price_slash' | 'bogo'
    is_active BOOLEAN DEFAULT true,
    
    -- Duration settings
    duration_hours INT NOT NULL DEFAULT 12, -- How long offer is valid
    
    -- Discount settings
    discount_type TEXT DEFAULT 'percentage', -- 'percentage' | 'fixed' | 'special_price'
    discount_value DECIMAL(10, 2), -- 20 for 20%, or fixed amount
    max_discount_cap DECIMAL(10, 2), -- Max discount cap (e.g., 1000 for BOGO)
    
    -- Flash deal specific
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    special_price DECIMAL(10, 2), -- For flash deals (e.g., 499)
    
    -- Display
    title TEXT NOT NULL,
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE welcome_offer_templates ENABLE ROW LEVEL SECURITY;

-- Allow public to read active templates (for offer service)
CREATE POLICY "Public can read active offer templates"
    ON welcome_offer_templates
    FOR SELECT
    USING (is_active = true);

-- Only admins can modify
CREATE POLICY "Admins can manage offer templates"
    ON welcome_offer_templates
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

-- Insert default configurations
INSERT INTO welcome_offer_templates (offer_type, is_active, duration_hours, discount_type, discount_value, max_discount_cap, title, description, special_price)
VALUES
    -- Flash Deal: Windows 11 Pro at ₹499 for 15 minutes
    ('flash_deal', true, 0.25, 'special_price', NULL, NULL, 'Flash Deal - Windows 11 Pro', 'Limited time offer at special price', 499),
    
    -- Price Slash: 20% off for 12 hours
    ('price_slash', true, 12, 'percentage', 20, NULL, '20% OFF First Purchase', 'Get 20% discount on any product', NULL),
    
    -- BOGO: Buy 1 Get 1 FREE for 12 hours, capped at ₹1000
    ('bogo', true, 12, 'fixed', NULL, 1000, 'Buy 1 Get 1 FREE', 'Cheapest item free, max discount ₹1000', NULL);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_welcome_offer_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_welcome_offer_templates_updated_at
    BEFORE UPDATE ON welcome_offer_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_welcome_offer_templates_updated_at();
