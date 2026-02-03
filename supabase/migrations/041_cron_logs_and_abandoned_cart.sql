-- Migration: Add cron job logs table and abandoned cart columns
-- Run this in Supabase SQL Editor

-- 1. Create cron_job_logs table
CREATE TABLE IF NOT EXISTS cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    duration_ms INTEGER,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_job_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_started_at ON cron_job_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_status ON cron_job_logs(status);

-- 2. Add abandoned cart recovery columns to cart_items
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Index for finding carts needing reminders
CREATE INDEX IF NOT EXISTS idx_cart_items_reminder ON cart_items(added_at, reminder_sent_at, reminder_count) 
WHERE reminder_count < 3;

-- 3. RLS Policy for cron_job_logs (admin only via service role)
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage cron logs" ON cron_job_logs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 4. Auto-cleanup old logs (keep last 30 days)
-- This is optional but recommended to prevent table bloat
-- You can set up a scheduled function in Supabase to run this

COMMENT ON TABLE cron_job_logs IS 'Stores execution history for all cron jobs';
COMMENT ON COLUMN cart_items.reminder_sent_at IS 'Last time an abandoned cart reminder was sent';
COMMENT ON COLUMN cart_items.reminder_count IS 'Number of reminder emails sent for this cart item';
