-- Migration: GetCID Usage Tracking Table
-- Purpose: Track Installation ID generation requests for abuse prevention

-- Create the getcid_usage table (logs all GetCID API calls)
CREATE TABLE IF NOT EXISTS getcid_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Generic identifier (works for both secret codes and order IDs)
  identifier VARCHAR(50) NOT NULL,
  identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('secret_code', 'order_id')),
  
  -- Request details
  installation_id TEXT NOT NULL,
  
  -- API response info
  confirmation_id TEXT,           -- 48-digit CID if successful
  api_response TEXT,              -- Full API response for debugging
  api_status VARCHAR(30),         -- 'success', 'wrong_iid', 'blocked', 'exceeded', etc.
  
  -- Client info for abuse tracking
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_getcid_usage_secret_code ON getcid_usage(secret_code);
CREATE INDEX IF NOT EXISTS idx_getcid_usage_order_id ON getcid_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_getcid_usage_created_at ON getcid_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_getcid_usage_installation_id ON getcid_usage(installation_id);

-- Enable RLS
ALTER TABLE getcid_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role only for security)
CREATE POLICY "Allow service role full access on getcid_usage" ON getcid_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Function to check usage count for rate limiting
CREATE OR REPLACE FUNCTION get_getcid_usage_count(p_secret_code VARCHAR DEFAULT NULL, p_order_id VARCHAR DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  IF p_secret_code IS NOT NULL THEN
    SELECT COUNT(*) INTO usage_count 
    FROM getcid_usage 
    WHERE secret_code = p_secret_code;
  ELSIF p_order_id IS NOT NULL THEN
    SELECT COUNT(*) INTO usage_count 
    FROM getcid_usage 
    WHERE order_id = p_order_id;
  ELSE
    usage_count := 0;
  END IF;
  
  RETURN usage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table
COMMENT ON TABLE getcid_usage IS 'Tracks getcid API usage for rate limiting and abuse prevention';
