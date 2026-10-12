-- ============================================================================
-- 010_add_customer_dni_to_orders.sql
-- Agrega columna opcional customer_dni para identificación fiscal (Factura C)
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_dni VARCHAR(30);
