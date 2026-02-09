-- Create product_image_baselines table for storing image hashes
-- Used to detect image changes in Amazon product listings

CREATE TABLE IF NOT EXISTS public.product_image_baselines (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    asin VARCHAR(20) NOT NULL,
    main_image_url TEXT,
    main_image_hash VARCHAR(64),  -- MD5 hash of image content
    image_count INTEGER DEFAULT 0,
    all_image_hashes JSONB DEFAULT '[]'::jsonb,  -- Array of {url, hash} objects
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT product_image_baselines_pkey PRIMARY KEY (id),
    CONSTRAINT product_image_baselines_asin_key UNIQUE (asin)
) TABLESPACE pg_default;

-- Index for quick ASIN lookups
CREATE INDEX IF NOT EXISTS idx_product_image_baselines_asin 
ON public.product_image_baselines USING btree (asin) TABLESPACE pg_default;

-- Comment for documentation
COMMENT ON TABLE public.product_image_baselines IS 'Stores baseline image hashes for detecting product image tampering';
