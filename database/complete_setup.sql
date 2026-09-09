-- ========================================================
-- SCRIPT CONSOLIDADO DE BASE DE DATOS — LOS ARRAYANES
-- Generado automáticamente a partir de los módulos atomizados
-- ========================================================


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SECCIÓN: MIGRACIONES DDL
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ARCHIVO: 001_extensions.sql

-- ============================================================================
-- 001_extensions.sql
-- Extensiones PostgreSQL y funciones utilitarias globales
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función trigger para actualizar automáticamente la columna updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ARCHIVO: 002_taxonomies.sql

-- ============================================================================
-- 002_taxonomies.sql
-- Tablas de taxonomía: categories, subcategories y brands
-- ============================================================================

-- 1. categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. subcategories
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. brands
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ARCHIVO: 003_products_variants.sql

-- ============================================================================
-- 003_products_variants.sql
-- Tablas de catálogo base: products y product_variants
-- ============================================================================

-- 4. products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE RESTRICT,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT,
    base_price DECIMAL(12, 2) NOT NULL CHECK (base_price > 0),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_on_sale BOOLEAN NOT NULL DEFAULT FALSE,
    sale_price DECIMAL(12, 2) CHECK (sale_price IS NULL OR sale_price > 0),
    image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at en products
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL UNIQUE,
    variant_name VARCHAR(100) NOT NULL,
    price_override DECIMAL(12, 2) CHECK (price_override IS NULL OR price_override > 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ARCHIVO: 004_orders_payments.sql

-- ============================================================================
-- 004_orders_payments.sql
-- Tablas transaccionales: orders, order_items y payments
-- ============================================================================

-- 6. orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'payment_pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(254) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    shipping_address VARCHAR(300) NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_province VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(10) NOT NULL,
    shipping_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal > 0),
    total DECIMAL(12, 2) NOT NULL CHECK (total > 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at en orders
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price > 0),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal > 0)
);

-- 8. payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    mp_preference_id VARCHAR(100),
    mp_payment_id VARCHAR(100),
    mp_status VARCHAR(50),
    mp_status_detail VARCHAR(100),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at en payments
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ARCHIVO: 005_shipping_and_admin.sql

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


-- ARCHIVO: 006_indexes_and_constraints.sql

-- ============================================================================
-- 006_indexes_and_constraints.sql
-- Índices de performance, claves foráneas y búsquedas rápidas
-- ============================================================================

-- Índices de taxonomías
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

-- Índices de productos y variantes
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(is_on_sale) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- Índices de pedidos y pagos
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON payments(mp_payment_id);



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SECCIÓN: DATOS SEMILLA (SEEDS)
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ARCHIVO: 01_brands.sql

-- ============================================================================
-- 01_brands.sql
-- Carga de marcas oficiales de Los Arrayanes (~29 marcas)
-- ============================================================================

INSERT INTO brands (name, slug) VALUES
    ('Nov', 'nov'),
    ('Plasma', 'plasma'),
    ('La Puissance', 'la-puissance'),
    ('Playcolor', 'playcolor'),
    ('Frilayp', 'frilayp'),
    ('Beauty Color', 'beauty-color'),
    ('Yilho', 'yilho'),
    ('Emynent', 'emynent'),
    ('Escudo', 'escudo'),
    ('Mac Gregor', 'mac-gregor'),
    ('Lash', 'lash'),
    ('Eurostyl', 'eurostyl'),
    ('Jessamy', 'jessamy'),
    ('X5', 'x5'),
    ('Roubaix', 'roubaix'),
    ('Magma', 'magma'),
    ('Duga', 'duga'),
    ('Kemei', 'kemei'),
    ('Wahl', 'wahl'),
    ('Royal Cut', 'royal-cut'),
    ('Mozku', 'mozku'),
    ('Everest', 'everest'),
    ('Geo 2000', 'geo-2000'),
    ('Dorco', 'dorco'),
    ('Treet', 'treet'),
    ('Nova', 'nova'),
    ('Scher', 'scher'),
    ('Kiepe', 'kiepe'),
    ('Andis', 'andis')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;


-- ARCHIVO: 02_categories_subcategories.sql

-- ============================================================================
-- 02_categories_subcategories.sql
-- Carga de categorías y subcategorías oficiales de Los Arrayanes
-- ============================================================================

-- Categorías principales (11 categorías)
INSERT INTO categories (name, slug, description, display_order) VALUES
    ('Coloración', 'coloracion', 'Tinturas, decolorantes, oxidantes y accesorios profesionales para coloristas', 1),
    ('Tratamientos Capilares', 'tratamientos-capilares', 'Máscaras, ampollas, alisados, cauterizados, protectores y serums', 2),
    ('Shampoos y Acondicionadores', 'shampoos-y-acondicionadores', 'Shampoos y acondicionadores profesionales para todo tipo de cabello', 3),
    ('Styling / Fijación', 'styling-fijacion', 'Geles, ceras modeladoras, pomadas, fijadores en spray y protectores térmicos', 4),
    ('Barbería', 'barberia', 'Productos específicos para el cuidado de barba, afeitado y mantenimiento de navajas', 5),
    ('Máquinas y Herramientas Eléctricas', 'maquinas-y-herramientas', 'Secadores, planchas, cortadoras, patilleras, tijeras y tornos', 6),
    ('Accesorios de Peluquería', 'accesorios-de-peluqueria', 'Peines, cepillos, ruleros, broches, rociadores y recipientes de trabajo', 7),
    ('Pestañas y Cejas', 'pestanas-y-cejas', 'Pestañas postizas en racimo o individuales, lifting, laminado y tintura', 8),
    ('Descartables e Higiene', 'descartables-e-higiene', 'Guantes de nitrilo y látex, gorros térmicos, capas, toallas y cubrecamillas', 9),
    ('Uñas y Manicuría', 'unas-y-manicuria', 'Limas profesionales, alicates, moldes, fresas y accesorios para manicuría', 10),
    ('Ondulación', 'ondulacion', 'Lociones para permanente, neutralizantes y ondulación con fórmulas nutritivas', 11)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- Subcategorías (~35 subcategorías asociadas a su respectiva categoría)
INSERT INTO subcategories (category_id, name, slug, display_order)
SELECT c.id, s.name, s.slug, s.display_order
FROM (
    VALUES
        -- Coloración
        ('coloracion', 'Tinturas', 'tinturas', 1),
        ('coloracion', 'Decoloración', 'decoloracion', 2),
        ('coloracion', 'Oxidantes', 'oxidantes', 3),
        ('coloracion', 'Matizadores', 'matizadores', 4),
        ('coloracion', 'Accesorios de Coloración', 'accesorios-coloracion', 5),
        -- Tratamientos Capilares
        ('tratamientos-capilares', 'Máscaras / Baños de Crema', 'mascaras-banos-crema', 1),
        ('tratamientos-capilares', 'Ampollas / Restauradores', 'ampollas-restauradores', 2),
        ('tratamientos-capilares', 'Alisados / Cauterizado', 'alisados-cauterizado', 3),
        ('tratamientos-capilares', 'Cremas de Peinar', 'cremas-de-peinar', 4),
        ('tratamientos-capilares', 'Serums / Aceites', 'serums-aceites', 5),
        -- Shampoos y Acondicionadores
        ('shampoos-y-acondicionadores', 'Shampoos', 'shampoos', 1),
        ('shampoos-y-acondicionadores', 'Acondicionadores / Bálsamos', 'acondicionadores-balsamos', 2),
        -- Styling / Fijación
        ('styling-fijacion', 'Geles', 'geles', 1),
        ('styling-fijacion', 'Ceras / Pomadas', 'ceras-pomadas', 2),
        ('styling-fijacion', 'Fijadores / Spray', 'fijadores-spray', 3),
        ('styling-fijacion', 'Protectores Térmicos', 'protectores-termicos', 4),
        -- Barbería
        ('barberia', 'Aceites y Bálsamos para Barba', 'aceites-balsamos-barba', 1),
        ('barberia', 'Afeitado', 'afeitado', 2),
        ('barberia', 'Navajas y Filos', 'navajas-y-filos', 3),
        ('barberia', 'Limpia Máquinas', 'limpia-maquinas', 4),
        -- Máquinas y Herramientas Eléctricas
        ('maquinas-y-herramientas', 'Secadores', 'secadores', 1),
        ('maquinas-y-herramientas', 'Planchas', 'planchas', 2),
        ('maquinas-y-herramientas', 'Patilleras / Máquinas de Corte', 'patilleras-maquinas-corte', 3),
        ('maquinas-y-herramientas', 'Bucleadoras', 'bucleadoras', 4),
        ('maquinas-y-herramientas', 'Tornos y Cabinas (Uñas)', 'tornos-y-cabinas', 5),
        ('maquinas-y-herramientas', 'Tijeras', 'tijeras', 6),
        -- Accesorios de Peluquería
        ('accesorios-de-peluqueria', 'Peines', 'peines', 1),
        ('accesorios-de-peluqueria', 'Cepillos', 'cepillos', 2),
        ('accesorios-de-peluqueria', 'Bigudíes y Ruleros', 'bigudies-y-ruleros', 3),
        ('accesorios-de-peluqueria', 'Broches y Sujetadores', 'broches-y-sujetadores', 4),
        ('accesorios-de-peluqueria', 'Bowls y Recipientes', 'bowls-y-recipientes', 5),
        ('accesorios-de-peluqueria', 'Rociadores y Pulverizadores', 'rociadores-y-pulverizadores', 6),
        -- Pestañas y Cejas
        ('pestanas-y-cejas', 'Pestañas Postizas', 'pestanas-postizas', 1),
        ('pestanas-y-cejas', 'Laminado y Lifting', 'laminado-y-lifting', 2),
        ('pestanas-y-cejas', 'Tintura de Pestañas', 'tintura-pestanas', 3),
        -- Descartables e Higiene
        ('descartables-e-higiene', 'Guantes', 'guantes', 1),
        ('descartables-e-higiene', 'Gorros y Capas', 'gorros-y-capas', 2),
        ('descartables-e-higiene', 'Toallas', 'toallas', 3),
        ('descartables-e-higiene', 'Cubrecamillas', 'cubrecamillas', 4),
        ('descartables-e-higiene', 'Vendas y Depilación', 'vendas-y-depilacion', 5),
        -- Uñas y Manicuría
        ('unas-y-manicuria', 'Limas', 'limas', 1),
        ('unas-y-manicuria', 'Moldes', 'moldes', 2),
        ('unas-y-manicuria', 'Alicates y Cortantes', 'alicates-y-cortantes', 3),
        ('unas-y-manicuria', 'Accesorios de Uñas', 'accesorios-de-unas', 4),
        ('unas-y-manicuria', 'Quitaesmalte', 'quitaesmalte', 5),
        -- Ondulación
        ('ondulacion', 'Lociones de Ondulación', 'lociones-ondulacion', 1)
) AS s(cat_slug, name, slug, display_order)
JOIN categories c ON c.slug = s.cat_slug
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order;


-- ARCHIVO: 03_shipping_zones.sql

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


-- ARCHIVO: 04_admin_user.sql

-- ============================================================================
-- 04_admin_user.sql
-- Usuario administrador inicial (password predeterminado: admin123!)
-- Hash generado con bcrypt ($2b$12$)
-- ============================================================================

INSERT INTO admin_users (email, password_hash, name)
VALUES (
    'admin@losarrayanes.com',
    '$2b$12$jtrkrw0UxyvIfelRzR1ww.31bG0pCQo3jzZuBu/MTF6AariFjUcfK',
    'Admin Los Arrayanes'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name;

