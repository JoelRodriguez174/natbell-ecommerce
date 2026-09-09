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
