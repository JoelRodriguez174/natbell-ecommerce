-- ============================================================================
-- 03_shipping_zones.sql
-- Tarifas y zonas iniciales de envío para Argentina
-- ============================================================================

INSERT INTO shipping_zones (zone_name, postal_code_ranges, cost, estimated_days)
VALUES
    ('CABA', '[{"from":"1000","to":"1499"}]'::jsonb, 3500.00, 2),
    ('GBA', '[{"from":"1500","to":"1999"},{"from":"1600","to":"1699"}]'::jsonb, 5000.00, 3),
    ('Interior del País', '[{"from":"2000","to":"9999"}]'::jsonb, 7500.00, 5)
ON CONFLICT (zone_name) DO UPDATE SET
    postal_code_ranges = EXCLUDED.postal_code_ranges,
    cost = EXCLUDED.cost,
    estimated_days = EXCLUDED.estimated_days;
