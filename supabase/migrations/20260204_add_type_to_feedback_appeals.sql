-- Add type column to feedback_appeals to distinguish between seller feedback and product reviews
-- Run this migration in Supabase SQL editor

ALTER TABLE public.feedback_appeals 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'feedback' 
CHECK (type IN ('feedback', 'review'));

-- Add partial_amount and refund_type columns if not exist
ALTER TABLE public.feedback_appeals 
ADD COLUMN IF NOT EXISTS refund_type text DEFAULT 'none'
CHECK (refund_type IN ('none', 'partial', 'full'));

ALTER TABLE public.feedback_appeals 
ADD COLUMN IF NOT EXISTS partial_amount numeric;

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS idx_feedback_appeals_type ON public.feedback_appeals(type);
