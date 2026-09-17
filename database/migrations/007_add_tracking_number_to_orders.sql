-- ============================================================================
-- 007_add_tracking_number_to_orders.sql
-- Agrega columna tracking_number a la tabla orders para gestión de despachos
-- ============================================================================

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
