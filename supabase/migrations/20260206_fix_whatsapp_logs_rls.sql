-- Migration: Fix WhatsApp Message Logs RLS policies  
-- Date: 2026-02-06
-- Purpose: Ensure admin client (service role) can access the logs

-- Option 1: Simplest fix - disable RLS since this table is only accessed via server-side API
-- The API uses service_role which should bypass RLS, but if there are issues:
ALTER TABLE public.whatsapp_message_logs DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS but ensure it works, uncomment below:
-- DROP POLICY IF EXISTS "Service role bypass" ON public.whatsapp_message_logs;
-- DROP POLICY IF EXISTS "Admin access only" ON public.whatsapp_message_logs;
-- CREATE POLICY "Allow all for authenticated" ON public.whatsapp_message_logs FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (true);

