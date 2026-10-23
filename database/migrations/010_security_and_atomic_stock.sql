-- ============================================================================
-- 010_security_and_atomic_stock.sql
-- 1. RLS en todas las tablas públicas (el backend usa service_role, que la saltea)
-- 2. Descuento de stock atómico para mark_order_paid
-- ============================================================================

-- 1. Row Level Security sin políticas: anon/authenticated no pueden leer ni escribir nada
--    vía Data API. El backend sigue funcionando porque usa la service key.
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons          ENABLE ROW LEVEL SECURITY;

-- 2. Descuenta stock con la fila bloqueada (FOR UPDATE): dos pagos simultáneos no pueden
--    leer el mismo valor. Devuelve FALSE si no alcanzaba el stock (sobreventa) o no existe la variante.
CREATE OR REPLACE FUNCTION public.decrement_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_had_enough BOOLEAN;
BEGIN
    SELECT stock >= p_quantity INTO v_had_enough
    FROM public.product_variants
    WHERE id = p_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    UPDATE public.product_variants
    SET stock = GREATEST(stock - p_quantity, 0)
    WHERE id = p_variant_id;

    RETURN v_had_enough;
END;
$$;

-- Solo el backend (service_role) puede llamarla vía RPC
REVOKE EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER) TO service_role;
