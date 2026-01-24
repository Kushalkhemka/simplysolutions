-- GetCID Tokens Table
-- Store multiple API tokens for GetCID service with usage tracking

CREATE TABLE IF NOT EXISTS getcid_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE,
    email TEXT,
    count_used INTEGER DEFAULT 0,
    total_available INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Higher priority tokens are used first
    last_verified_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active token lookup
CREATE INDEX IF NOT EXISTS idx_getcid_tokens_active ON getcid_tokens(is_active, priority DESC) WHERE is_active = TRUE;

-- Add RLS policies
ALTER TABLE getcid_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access (no client access)
CREATE POLICY "Service role can manage getcid_tokens"
    ON getcid_tokens
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Insert initial tokens with their current usage from API verification
INSERT INTO getcid_tokens (token, email, count_used, total_available, priority, last_verified_at)
VALUES 
    ('4aiw4hbq5da', 'kushalkhemka559@gmail.com', 67, 100, 1, NOW()),
    ('f540ltcwv3v', 'kushalkhemka559@gmail.com', 0, 100, 2, NOW()),
    ('tkyj5x3rb32', 'beenakhemka559@gmail.com', 0, 100, 3, NOW())
ON CONFLICT (token) DO UPDATE SET
    count_used = EXCLUDED.count_used,
    total_available = EXCLUDED.total_available,
    last_verified_at = NOW();

-- Function to get the best available token (with remaining capacity, highest priority)
CREATE OR REPLACE FUNCTION get_available_getcid_token()
RETURNS TABLE(token TEXT, remaining_uses INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT t.token, (t.total_available - t.count_used) AS remaining_uses
    FROM getcid_tokens t
    WHERE t.is_active = TRUE
      AND t.count_used < t.total_available
    ORDER BY t.priority DESC, t.count_used ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment token usage
CREATE OR REPLACE FUNCTION increment_getcid_token_usage(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE getcid_tokens
    SET count_used = count_used + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE token = p_token
      AND count_used < total_available;
    
    v_updated := FOUND;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE getcid_tokens IS 'Stores GetCID API tokens with usage tracking for rotation';
COMMENT ON COLUMN getcid_tokens.priority IS 'Higher priority tokens are selected first. Use this to prefer certain tokens.';
COMMENT ON COLUMN getcid_tokens.count_used IS 'Number of times this token has been used. Incremented on each successful GetCID call.';
