-- Create listing_keyword_alerts table for storing scan results
-- This enables auto-loading of last scan on page mount

CREATE TABLE IF NOT EXISTS public.listing_keyword_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    products_scanned INTEGER NOT NULL DEFAULT 0,
    products_flagged INTEGER NOT NULL DEFAULT 0,
    flagged_details JSONB DEFAULT '[]'::jsonb,
    alert_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT listing_keyword_alerts_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Index for fetching latest scan quickly
CREATE INDEX IF NOT EXISTS idx_listing_keyword_alerts_scanned_at 
ON public.listing_keyword_alerts USING btree (scanned_at DESC) TABLESPACE pg_default;

-- Comment for documentation
COMMENT ON TABLE public.listing_keyword_alerts IS 'Stores listing keyword scan results for the competitor sabotage detection monitor';
