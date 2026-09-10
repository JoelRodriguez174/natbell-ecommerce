-- ============================================================================
-- 05_sample_products.sql
-- Datos semilla de productos y variantes iniciales para Natbell E-commerce
-- Catálogo provisto por Los Arrayanes
-- ============================================================================

-- 1. Nov — Tintura en Crema Profesional 60g
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'tinturas' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'nov' LIMIT 1),
    'Tintura en Crema Profesional 60g',
    'nov-tintura-en-crema-profesional-60g',
    'Coloración permanente en crema con fórmula enriquecida que cuida la fibra capilar, logrando tonos vibrantes, cobertura 100% de canas y brillo espejo de larga duración.',
    3800.00,
    TRUE,
    FALSE,
    NULL,
    '["https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    is_featured = EXCLUDED.is_featured,
    image_urls = EXCLUDED.image_urls;

-- Variantes de Tintura Nov
INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'nov-tintura-en-crema-profesional-60g'), 'NOV-TINT-10', 'Tono 1.0 Negro Profundo (60g)', NULL, 20, TRUE),
    ((SELECT id FROM products WHERE slug = 'nov-tintura-en-crema-profesional-60g'), 'NOV-TINT-71', 'Tono 7.1 Rubio Ceniza (60g)', NULL, 25, TRUE),
    ((SELECT id FROM products WHERE slug = 'nov-tintura-en-crema-profesional-60g'), 'NOV-TINT-80', 'Tono 8.0 Rubio Claro (60g)', NULL, 15, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock;


-- 2. Plasma — Polvo Decolorante White Blue 500g
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'decoloracion' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'plasma' LIMIT 1),
    'Polvo Decolorante White Blue 500g',
    'plasma-polvo-decolorante-white-blue-500g',
    'Decolorante ultrarrápido microgranular no volátil con pigmentos anti-amarillo. Aclara hasta 7 tonos preservando la elasticidad y suavidad del cabello.',
    13500.00,
    TRUE,
    TRUE,
    11900.00,
    '["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    sale_price = EXCLUDED.sale_price,
    is_on_sale = EXCLUDED.is_on_sale,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'plasma-polvo-decolorante-white-blue-500g'), 'PLA-DEC-500', 'Pote 500g', NULL, 12, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock;


-- 3. La Puissance — Shampoo Nutritivo con Argán
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'shampoos' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'la-puissance' LIMIT 1),
    'Shampoo Nutritivo con Óleo de Argán',
    'la-puissance-shampoo-nutritivo-argan',
    'Limpieza delicada con alta concentración de óleo puro de argán y vitamina E. Regenera cabellos secos o castigados por procesos químicos devolviendo suavidad y soltura.',
    7200.00,
    TRUE,
    FALSE,
    NULL,
    '["https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'la-puissance-shampoo-nutritivo-argan'), 'LP-SH-300', 'Botella 300ml', 7200.00, 24, TRUE),
    ((SELECT id FROM products WHERE slug = 'la-puissance-shampoo-nutritivo-argan'), 'LP-SH-1000', 'Bidón Profesional 1000ml', 15400.00, 10, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock, price_override = EXCLUDED.price_override;


-- 4. La Puissance — Acondicionador Nutritivo con Argán
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'acondicionadores-balsamos' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'la-puissance' LIMIT 1),
    'Acondicionador Desenredante con Argán',
    'la-puissance-acondicionador-desenredante-argan',
    'Desenreda instantáneamente, sella la cutícula capilar y previene el encrespamiento (frizz) aportando luminosidad intensa y sedosidad.',
    7500.00,
    FALSE,
    FALSE,
    NULL,
    '["https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'la-puissance-acondicionador-desenredante-argan'), 'LP-AC-300', 'Botella 300ml', 7500.00, 18, TRUE),
    ((SELECT id FROM products WHERE slug = 'la-puissance-acondicionador-desenredante-argan'), 'LP-AC-1000', 'Bidón Profesional 1000ml', 15900.00, 8, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock, price_override = EXCLUDED.price_override;


-- 5. La Puissance — Máscara Restauradora Intensiva Keratina
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'mascaras-banos-crema' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'la-puissance' LIMIT 1),
    'Máscara Restauradora Intensiva con Keratina',
    'la-puissance-mascara-restauradora-keratina',
    'Tratamiento intensivo de choque formulado con keratina hidrolizada bioactiva. Reconstruye la estructura proteica interna del cabello debilitado.',
    11200.00,
    TRUE,
    TRUE,
    9800.00,
    '["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    sale_price = EXCLUDED.sale_price,
    is_on_sale = EXCLUDED.is_on_sale,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'la-puissance-mascara-restauradora-keratina'), 'LP-MASK-250', 'Pote 250g', 9800.00, 15, TRUE),
    ((SELECT id FROM products WHERE slug = 'la-puissance-mascara-restauradora-keratina'), 'LP-MASK-1000', 'Pote 1000g', 21500.00, 7, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock, price_override = EXCLUDED.price_override;


-- 6. Nov — Crema Oxidante Estabilizada
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'oxidantes' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'nov' LIMIT 1),
    'Crema Oxidante Estabilizada 900ml',
    'nov-crema-oxidante-estabilizada-900ml',
    'Emulsión cremosa oxidante con estabilizadores de volumen para una activación homogénea y segura de tinturas y polvos decolorantes.',
    4900.00,
    FALSE,
    FALSE,
    NULL,
    '["https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'nov-crema-oxidante-estabilizada-900ml'), 'NOV-OX-20', '20 Volúmenes (900ml)', NULL, 30, TRUE),
    ((SELECT id FROM products WHERE slug = 'nov-crema-oxidante-estabilizada-900ml'), 'NOV-OX-30', '30 Volúmenes (900ml)', NULL, 28, TRUE),
    ((SELECT id FROM products WHERE slug = 'nov-crema-oxidante-estabilizada-900ml'), 'NOV-OX-40', '40 Volúmenes (900ml)', NULL, 15, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock;


-- 7. Plasma — Serum Reparador de Puntas Argán & Lino
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'serums-aceites' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'plasma' LIMIT 1),
    'Serum Reparador de Puntas Argán & Lino 50ml',
    'plasma-serum-reparador-puntas-argan-lino',
    'Fluido sellador concentrado para puntas abiertas. Crea una película protectora invisible contra el calor térmico y las agresiones ambientales.',
    6800.00,
    TRUE,
    FALSE,
    NULL,
    '["https://images.unsplash.com/photo-1608248597359-bb5833076758?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'plasma-serum-reparador-puntas-argan-lino'), 'PLA-SER-50', 'Frasco dosificador 50ml', NULL, 22, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock;


-- 8. Kemei — Máquina Cortadora de Pelo Profesional Inalámbrica KM-1990
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'patilleras-maquinas-corte' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'kemei' LIMIT 1),
    'Cortadora Profesional Inalámbrica KM-1990',
    'kemei-cortadora-profesional-km-1990',
    'Máquina de corte profesional con motor de alta potencia, pantalla LCD digital indicadora de batería, cuchilla de acero al carbono y batería de litio con 120 min de autonomía.',
    38900.00,
    TRUE,
    TRUE,
    34500.00,
    '["https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    sale_price = EXCLUDED.sale_price,
    is_on_sale = EXCLUDED.is_on_sale,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'kemei-cortadora-profesional-km-1990'), 'KM-1990-GOLD', 'Edición Oro Metálico', NULL, 8, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock;


-- 9. Kemei — Patillera Barbera Detailer KM-T9
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'patilleras-maquinas-corte' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'kemei' LIMIT 1),
    'Patillera Trimmer Barbera Detailer KM-T9',
    'kemei-patillera-trimmer-t9',
    'Trimmer de contornos, barba y dibujos con cabezal en T ultra fino. Precisión milimétrica al ras (0.1mm) para barberos y estilistas exigentes.',
    19800.00,
    FALSE,
    FALSE,
    NULL,
    '["https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'kemei-patillera-trimmer-t9'), 'KM-T9-BRONZE', 'Cuerpo Bronce Grabado', NULL, 15, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock;


-- 10. Wahl — Cortadora Clásica Super Taper Profesional
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'patilleras-maquinas-corte' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'wahl' LIMIT 1),
    'Cortadora Clásica Wahl Super Taper Cable V5000',
    'wahl-super-taper-clasica-v5000',
    'El clásico indiscutido de las barberías de todo el mundo. Motor electromagnético V5000 de máxima durabilidad y palanca de ajuste de guía de corte.',
    78000.00,
    TRUE,
    FALSE,
    NULL,
    '["https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'wahl-super-taper-clasica-v5000'), 'WAHL-ST-WHITE', 'Blanca Tradicional', NULL, 6, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock;


-- 11. Mac Gregor — Pomada Modeladora Base Agua Efecto Mate
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'ceras-pomadas' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'mac-gregor' LIMIT 1),
    'Pomada Modeladora Base Agua Efecto Mate 100g',
    'mac-gregor-pomada-modeladora-mate-100g',
    'Fijación fuerte y acabado natural sin brillo. Se reactiva con agua y no deja residuos en el cabello.',
    5900.00,
    FALSE,
    TRUE,
    5200.00,
    '["https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    sale_price = EXCLUDED.sale_price,
    is_on_sale = EXCLUDED.is_on_sale,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'mac-gregor-pomada-modeladora-mate-100g'), 'MG-POM-MATE', 'Mate Fuerte (100g)', 5200.00, 25, TRUE),
    ((SELECT id FROM products WHERE slug = 'mac-gregor-pomada-modeladora-mate-100g'), 'MG-POM-BRILLO', 'Brillo Clásico (100g)', 5200.00, 14, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock, price_override = EXCLUDED.price_override;


-- 12. Escudo — Tijera de Pulir / Microdentada 5.5"
INSERT INTO products (
    subcategory_id, brand_id, name, slug, description, base_price, is_featured, is_on_sale, sale_price, image_urls, is_active
) VALUES (
    (SELECT id FROM subcategories WHERE slug = 'tijeras' LIMIT 1),
    (SELECT id FROM brands WHERE slug = 'escudo' LIMIT 1),
    'Tijera de Pulir Microdentada Profesional 5.5"',
    'escudo-tijera-pulir-microdentada-55',
    'Tijera de precisión para descargar volumen y texturizar. Forjada en acero inoxidable japonés con filo de larga duración y apoyo de dedo extraíble.',
    14500.00,
    FALSE,
    FALSE,
    NULL,
    '["https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    image_urls = EXCLUDED.image_urls;

INSERT INTO product_variants (product_id, sku, variant_name, price_override, stock, is_active)
VALUES
    ((SELECT id FROM products WHERE slug = 'escudo-tijera-pulir-microdentada-55'), 'ESC-TIJ-55', '5.5 pulgadas (Acero Inoxidable)', NULL, 10, TRUE)
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock;
