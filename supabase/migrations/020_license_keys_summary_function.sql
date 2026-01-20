-- Create an efficient function to get license key summary by FSN
-- Fixed: Set search_path = '' for security
CREATE OR REPLACE FUNCTION public.get_license_keys_by_fsn_summary()
RETURNS TABLE (
    fsn VARCHAR(100),
    total_count BIGINT,
    available_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT 
        fsn,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE is_redeemed = false) as available_count
    FROM public.amazon_activation_license_keys
    WHERE fsn IS NOT NULL
    GROUP BY fsn
    ORDER BY (COUNT(*) FILTER (WHERE is_redeemed = false)) ASC;
$$;

-- Grant access to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.get_license_keys_by_fsn_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_license_keys_by_fsn_summary() TO service_role;
