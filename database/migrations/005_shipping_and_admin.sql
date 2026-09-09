-- ============================================================================
-- 005_shipping_and_admin.sql
-- Tablas de configuración: shipping_zones y admin_users
-- ============================================================================

-- 9. shipping_zones
CREATE TABLE IF NOT EXISTS shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(100) NOT NULL UNIQUE,
    postal_code_ranges JSONB NOT NULL,
    cost DECIMAL(12, 2) NOT NULL CHECK (cost >= 0),
    estimated_days INTEGER NOT NULL CHECK (estimated_days > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. admin_users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
