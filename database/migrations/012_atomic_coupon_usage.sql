-- ============================================================================
-- 012_atomic_coupon_usage.sql
-- Suma un uso al cupón en una sola sentencia: dos pagos simultáneos con el mismo cupón
-- no pueden leer el mismo times_used y perder un uso.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
    UPDATE public.coupons
    SET times_used = times_used + 1
    WHERE code = upper(trim(p_code));
$$;

-- Solo el backend (service_role) puede llamarla vía RPC
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) TO service_role;
