-- ============================================================================
-- 013_orders_customer_dni.sql
-- DNI del comprador, pedido en el checkout y enviado a Andreani como DNI del destinatario
-- (en el retiro en sucursal Andreani lo verifica). Correr ANTES de desplegar el backend
-- que lo guarda, o la creación de pedidos falla.
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_dni VARCHAR(11);

COMMENT ON COLUMN orders.customer_dni IS 'DNI del comprador (solo números), destinatario del envío en Andreani';
