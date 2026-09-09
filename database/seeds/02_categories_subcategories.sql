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
