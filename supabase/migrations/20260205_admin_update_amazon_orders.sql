-- Migration: Add admin UPDATE policy to amazon_orders
-- Date: 2026-02-05
-- Purpose: Allow admin users to update amazon_orders (for activation issues, fraud marking, etc.)

-- Add UPDATE policy for admin users
CREATE POLICY "Allow admin update on amazon_orders" ON public.amazon_orders
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  );

-- Also add DELETE policy for admins (if needed in future)
CREATE POLICY "Allow admin delete on amazon_orders" ON public.amazon_orders
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  );
