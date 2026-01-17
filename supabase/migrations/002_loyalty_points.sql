-- ===========================================
-- LOYALTY POINTS SYSTEM
-- Migration: 002_loyalty_points.sql
-- ===========================================

-- Add loyalty points balance to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS loyalty_points_balance DECIMAL(10,2) DEFAULT 0 CHECK (loyalty_points_balance >= 0);

CREATE INDEX IF NOT EXISTS idx_profiles_loyalty_balance ON public.profiles(loyalty_points_balance);

-- Add loyalty points used to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS loyalty_points_used DECIMAL(10,2) DEFAULT 0 CHECK (loyalty_points_used >= 0),
ADD COLUMN IF NOT EXISTS loyalty_points_earned DECIMAL(10,2) DEFAULT 0 CHECK (loyalty_points_earned >= 0);

-- Create loyalty transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
    points DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_transactions_user ON public.loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_order ON public.loyalty_transactions(order_id);
CREATE INDEX idx_loyalty_transactions_type ON public.loyalty_transactions(transaction_type);
CREATE INDEX idx_loyalty_transactions_created ON public.loyalty_transactions(created_at DESC);

-- Enable RLS on loyalty transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view own loyalty transactions" 
    ON public.loyalty_transactions 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Function to update user's loyalty points balance
CREATE OR REPLACE FUNCTION update_loyalty_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance DECIMAL(10,2);
BEGIN
    -- Get current balance
    SELECT loyalty_points_balance INTO current_balance
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Calculate new balance based on transaction type
    IF NEW.transaction_type = 'earned' THEN
        current_balance := current_balance + NEW.points;
    ELSIF NEW.transaction_type = 'redeemed' THEN
        current_balance := current_balance - NEW.points;
    ELSIF NEW.transaction_type = 'adjusted' THEN
        current_balance := current_balance + NEW.points; -- points can be negative for adjustments
    ELSIF NEW.transaction_type = 'expired' THEN
        current_balance := current_balance - NEW.points;
    END IF;
    
    -- Ensure balance doesn't go negative
    IF current_balance < 0 THEN
        current_balance := 0;
    END IF;
    
    -- Update balance_after in the new transaction record
    NEW.balance_after := current_balance;
    
    -- Update user's loyalty points balance
    UPDATE public.profiles
    SET loyalty_points_balance = current_balance
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update balance when a transaction is created
CREATE TRIGGER update_balance_on_loyalty_transaction
    BEFORE INSERT ON public.loyalty_transactions
    FOR EACH ROW 
    EXECUTE FUNCTION update_loyalty_balance();

-- Function to calculate max redeemable points (10% of order amount)
CREATE OR REPLACE FUNCTION calculate_max_redeemable_points(
    order_amount DECIMAL(10,2),
    user_points_balance DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    max_discount DECIMAL(10,2);
    max_redeemable DECIMAL(10,2);
BEGIN
    -- Calculate 10% of order amount
    max_discount := order_amount * 0.10;
    
    -- The max redeemable is the lesser of 10% of order or user's balance
    max_redeemable := LEAST(max_discount, user_points_balance);
    
    -- Round down to 2 decimal places
    RETURN ROUND(max_redeemable, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION calculate_max_redeemable_points(DECIMAL, DECIMAL) TO authenticated;
