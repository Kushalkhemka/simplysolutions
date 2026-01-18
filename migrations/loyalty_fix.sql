-- =====================================================
-- SimplySolutions - Loyalty Points Balance Fix
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add loyalty_points_balance column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_points_balance INTEGER DEFAULT 0;

-- Create loyalty_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'bonus', 'expired', 'adjustment')),
    points INTEGER NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order ON loyalty_transactions(order_id);

-- Enable RLS
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users can view own loyalty transactions" ON loyalty_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Add loyalty_points_earned column to orders if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_used INTEGER DEFAULT 0;

-- Create function to update loyalty points balance after transaction
-- This function will be triggered after each loyalty_transaction insert
CREATE OR REPLACE FUNCTION update_loyalty_points_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type IN ('earned', 'bonus') THEN
        UPDATE profiles 
        SET loyalty_points_balance = COALESCE(loyalty_points_balance, 0) + NEW.points
        WHERE id = NEW.user_id;
    ELSIF NEW.transaction_type IN ('redeemed', 'expired') THEN
        UPDATE profiles 
        SET loyalty_points_balance = GREATEST(0, COALESCE(loyalty_points_balance, 0) - NEW.points)
        WHERE id = NEW.user_id;
    ELSIF NEW.transaction_type = 'adjustment' THEN
        -- Adjustment can be positive or negative
        UPDATE profiles 
        SET loyalty_points_balance = GREATEST(0, COALESCE(loyalty_points_balance, 0) + NEW.points)
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_update_loyalty_balance ON loyalty_transactions;
CREATE TRIGGER trigger_update_loyalty_balance
    AFTER INSERT ON loyalty_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_points_balance();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Loyalty system migration completed successfully!';
    RAISE NOTICE '  - Added loyalty_points_balance to profiles';
    RAISE NOTICE '  - Created loyalty_transactions table';
    RAISE NOTICE '  - Added trigger to auto-update balance';
END $$;
