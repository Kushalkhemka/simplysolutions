-- Migration: Add email webhook logs table for debugging
-- Stores all incoming webhook requests for debugging and audit purposes

CREATE TABLE IF NOT EXISTS email_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Email details
    subject TEXT,
    from_address TEXT,
    to_address TEXT,
    
    -- Processing details
    order_ids TEXT[], -- Extracted order IDs
    action TEXT, -- 'processed', 'ignored', 'error', 'no_orders_found'
    orders_marked INTEGER DEFAULT 0,
    
    -- Debug info
    content_type TEXT,
    payload_keys TEXT[],
    error_message TEXT,
    
    -- Full payload for debugging (JSON)
    raw_payload JSONB
);

-- Index for querying recent logs
CREATE INDEX IF NOT EXISTS idx_email_webhook_logs_received ON email_webhook_logs(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_webhook_logs_action ON email_webhook_logs(action);

-- Clean up old logs after 30 days (optional - you can adjust or create a cron job)
COMMENT ON TABLE email_webhook_logs IS 'Stores all incoming email webhook requests for debugging. Consider periodic cleanup of old records.';
