-- Migration: WhatsApp Message Logs
-- Date: 2026-02-05
-- Purpose: Track all WhatsApp messages sent for debugging and resend capability

-- Create the whatsapp_message_logs table
CREATE TABLE IF NOT EXISTS public.whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  template_variables JSONB,
  message_id VARCHAR(200),           -- Meta's wamid
  status VARCHAR(20) NOT NULL,       -- 'success', 'failed'
  error_message TEXT,
  context VARCHAR(50),               -- 'feedback_appeal', 'warranty', 'replacement', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_order_id ON public.whatsapp_message_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON public.whatsapp_message_logs(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON public.whatsapp_message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_context ON public.whatsapp_message_logs(context);

-- Enable RLS
ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admin access only" ON public.whatsapp_message_logs
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  );

-- Service role bypass for backend operations
CREATE POLICY "Service role bypass" ON public.whatsapp_message_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE public.whatsapp_message_logs IS 'Tracks all WhatsApp messages sent from the system for debugging and resend capability';
