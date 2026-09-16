import os
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MIGRATIONS_DIR = os.path.join(ROOT_DIR, "database", "migrations")
SEEDS_DIR = os.path.join(ROOT_DIR, "database", "seeds")


def test_migration_files_exist_and_ordered():
    """Verifica que todos los archivos de migración DDL existan y sigan el orden."""
    expected_migrations = [
        "001_extensions.sql",
        "002_taxonomies.sql",
        "003_products_variants.sql",
        "004_orders_payments.sql",
        "005_shipping_and_admin.sql",
        "006_indexes_and_constraints.sql",
    ]
    for filename in expected_migrations:
        file_path = os.path.join(MIGRATIONS_DIR, filename)
        assert os.path.isfile(file_path), f"Falta el archivo de migración: {filename}"
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            assert len(content) > 20, f"El archivo {filename} está vacío o incompleto"
            assert "CREATE " in content or "--" in content


def test_seed_files_exist_and_contain_data():
    """Verifica que los archivos de semillas existan y contengan las inserciones esperadas."""
    expected_seeds = [
        "01_brands.sql",
        "02_categories_subcategories.sql",
        "03_shipping_zones.sql",
        "04_admin_user.sql",
    ]
    for filename in expected_seeds:
        file_path = os.path.join(SEEDS_DIR, filename)
        assert os.path.isfile(file_path), f"Falta el archivo de semillas: {filename}"
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            assert len(content) > 20, f"El archivo {filename} está vacío o incompleto"
            assert "INSERT INTO" in content


def test_brands_seed_count():
    """Verifica que se encuentren registradas las marcas principales del catálogo."""
    brands_path = os.path.join(SEEDS_DIR, "01_brands.sql")
    with open(brands_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extraer pares ('Nombre', 'slug')
    brand_tuples = re.findall(r"\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)", content)
    assert len(brand_tuples) >= 25, f"Se esperaban al menos 25 marcas, encontradas: {len(brand_tuples)}"

    brand_names = [name for name, _ in brand_tuples]
    assert "Nov" in brand_names
    assert "Plasma" in brand_names
    assert "La Puissance" in brand_names
    assert "Kemei" in brand_names


def test_categories_and_subcategories_seed():
    """Verifica que se encuentren las 11 categorías oficiales de Los Arrayanes."""
    cat_path = os.path.join(SEEDS_DIR, "02_categories_subcategories.sql")
    with open(cat_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "'Coloración'" in content
    assert "'Tratamientos Capilares'" in content
    assert "'Shampoos y Acondicionadores'" in content
    assert "'Barbería'" in content
    assert "'Máquinas y Herramientas Eléctricas'" in content
    assert "'Uñas y Manicuría'" in content
