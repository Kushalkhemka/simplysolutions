-- Add buyer_name column to amazon_orders
-- Note: Amazon SP-API does NOT return buyer name by default (it is restricted PII).
-- This column is for manual entry or future use with Restricted Data Token (RDT) access.

ALTER TABLE public.amazon_orders
  ADD COLUMN IF NOT EXISTS buyer_name character varying(200) null;

-- Index for search performance
CREATE INDEX IF NOT EXISTS idx_amazon_orders_buyer_name
  ON public.amazon_orders USING btree (buyer_name)
  TABLESPACE pg_default;

COMMENT ON COLUMN public.amazon_orders.buyer_name IS 
  'Buyer name - not returned by default Amazon SP-API; requires Restricted Data Token (RDT) access. Can be set manually.';
