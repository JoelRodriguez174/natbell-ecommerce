import os
import sys

# Forzar UTF-8 en stdout para terminales Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        getattr(sys.stdout, "reconfigure")(encoding="utf-8")
    except Exception:
        pass

# Asegurar importación del backend
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import get_supabase_client

SAMPLE_PRODUCTS = [
    {
        "subcategory_slug": "tinturas",
        "brand_slug": "nov",
        "name": "Tintura en Crema Profesional 60g",
        "slug": "nov-tintura-en-crema-profesional-60g",
        "description": "Coloración permanente en crema con fórmula enriquecida que cuida la fibra capilar, logrando tonos vibrantes, cobertura 100% de canas y brillo espejo de larga duración.",
        "base_price": 3800.00,
        "is_featured": True,
        "is_on_sale": False,
        "sale_price": None,
        "image_urls": ["https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "NOV-TINT-10", "variant_name": "Tono 1.0 Negro Profundo (60g)", "price_override": None, "stock": 20, "is_active": True},
            {"sku": "NOV-TINT-71", "variant_name": "Tono 7.1 Rubio Ceniza (60g)", "price_override": None, "stock": 25, "is_active": True},
            {"sku": "NOV-TINT-80", "variant_name": "Tono 8.0 Rubio Claro (60g)", "price_override": None, "stock": 15, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "decoloracion",
        "brand_slug": "plasma",
        "name": "Polvo Decolorante White Blue 500g",
        "slug": "plasma-polvo-decolorante-white-blue-500g",
        "description": "Decolorante ultrarrápido microgranular no volátil con pigmentos anti-amarillo. Aclara hasta 7 tonos preservando la elasticidad y suavidad del cabello.",
        "base_price": 13500.00,
        "is_featured": True,
        "is_on_sale": True,
        "sale_price": 11900.00,
        "image_urls": ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "PLA-DEC-500", "variant_name": "Pote 500g", "price_override": None, "stock": 12, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "shampoos",
        "brand_slug": "la-puissance",
        "name": "Shampoo Nutritivo con Óleo de Argán",
        "slug": "la-puissance-shampoo-nutritivo-argan",
        "description": "Limpieza delicada con alta concentración de óleo puro de argán y vitamina E. Regenera cabellos secos o castigados por procesos químicos devolviendo suavidad y soltura.",
        "base_price": 7200.00,
        "is_featured": True,
        "is_on_sale": False,
        "sale_price": None,
        "image_urls": ["https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "LP-SH-300", "variant_name": "Botella 300ml", "price_override": 7200.00, "stock": 24, "is_active": True},
            {"sku": "LP-SH-1000", "variant_name": "Bidón Profesional 1000ml", "price_override": 15400.00, "stock": 10, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "acondicionadores-balsamos",
        "brand_slug": "la-puissance",
        "name": "Acondicionador Desenredante con Argán",
        "slug": "la-puissance-acondicionador-desenredante-argan",
        "description": "Desenreda instantáneamente, sella la cutícula capilar y previene el encrespamiento (frizz) aportando luminosidad intensa y sedosidad.",
        "base_price": 7500.00,
        "is_featured": False,
        "is_on_sale": False,
        "sale_price": None,
        "image_urls": ["https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "LP-AC-300", "variant_name": "Botella 300ml", "price_override": 7500.00, "stock": 18, "is_active": True},
            {"sku": "LP-AC-1000", "variant_name": "Bidón Profesional 1000ml", "price_override": 15900.00, "stock": 8, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "mascaras-banos-crema",
        "brand_slug": "la-puissance",
        "name": "Máscara Restauradora Intensiva con Keratina",
        "slug": "la-puissance-mascara-restauradora-keratina",
        "description": "Tratamiento intensivo de choque formulado con keratina hidrolizada bioactiva. Reconstruye la estructura proteica interna del cabello debilitado.",
        "base_price": 11200.00,
        "is_featured": True,
        "is_on_sale": True,
        "sale_price": 9800.00,
        "image_urls": ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "LP-MASK-250", "variant_name": "Pote 250g", "price_override": 9800.00, "stock": 15, "is_active": True},
            {"sku": "LP-MASK-1000", "variant_name": "Pote 1000g", "price_override": 21500.00, "stock": 7, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "oxidantes",
        "brand_slug": "nov",
        "name": "Crema Oxidante Estabilizada 900ml",
        "slug": "nov-crema-oxidante-estabilizada-900ml",
        "description": "Emulsión cremosa oxidante con estabilizadores de volumen para una activación homogénea y segura de tinturas y polvos decolorantes.",
        "base_price": 4900.00,
        "is_featured": False,
        "is_on_sale": False,
        "sale_price": None,
        "image_urls": ["https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "NOV-OX-20", "variant_name": "20 Volúmenes (900ml)", "price_override": None, "stock": 30, "is_active": True},
            {"sku": "NOV-OX-30", "variant_name": "30 Volúmenes (900ml)", "price_override": None, "stock": 28, "is_active": True},
            {"sku": "NOV-OX-40", "variant_name": "40 Volúmenes (900ml)", "price_override": None, "stock": 15, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "serums-aceites",
        "brand_slug": "plasma",
        "name": "Serum Reparador de Puntas Argán & Lino 50ml",
        "slug": "plasma-serum-reparador-puntas-argan-lino",
        "description": "Fluido sellador concentrado para puntas abiertas. Crea una película protectora invisible contra el calor térmico y las agresiones ambientales.",
        "base_price": 6800.00,
        "is_featured": True,
        "is_on_sale": False,
        "sale_price": None,
        "image_urls": ["https://images.unsplash.com/photo-1608248597359-bb5833076758?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "PLA-SER-50", "variant_name": "Frasco dosificador 50ml", "price_override": None, "stock": 22, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "patilleras-maquinas-corte",
        "brand_slug": "kemei",
        "name": "Cortadora Profesional Inalámbrica KM-1990",
        "slug": "kemei-cortadora-profesional-km-1990",
        "description": "Máquina de corte profesional con motor de alta potencia, pantalla LCD digital indicadora de batería, cuchilla de acero al carbono y batería de litio con 120 min de autonomía.",
        "base_price": 38900.00,
        "is_featured": True,
        "is_on_sale": True,
        "sale_price": 34500.00,
        "image_urls": ["https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "KM-1990-GOLD", "variant_name": "Edición Oro Metálico", "price_override": None, "stock": 8, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "patilleras-maquinas-corte",
        "brand_slug": "kemei",
        "name": "Patillera Trimmer Barbera Detailer KM-T9",
        "slug": "kemei-patillera-trimmer-t9",
        "description": "Trimmer de contornos, barba y dibujos con cabezal en T ultra fino. Precisión milimétrica al ras (0.1mm) para barberos y estilistas exigentes.",
        "base_price": 19800.00,
        "is_featured": False,
        "is_on_sale": False,
        "sale_price": None,
        "image_urls": ["https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "KM-T9-BRONZE", "variant_name": "Cuerpo Bronce Grabado", "price_override": None, "stock": 15, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "patilleras-maquinas-corte",
        "brand_slug": "wahl",
        "name": "Cortadora Clásica Wahl Super Taper Cable V5000",
        "slug": "wahl-super-taper-clasica-v5000",
        "description": "El clásico indiscutido de las barberías de todo el mundo. Motor electromagnético V5000 de máxima durabilidad y palanca de ajuste de guía de corte.",
        "base_price": 78000.00,
        "is_featured": True,
        "is_on_sale": False,
        "sale_price": None,
        "image_urls": ["https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "WAHL-ST-WHITE", "variant_name": "Blanca Tradicional", "price_override": None, "stock": 6, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "ceras-pomadas",
        "brand_slug": "mac-gregor",
        "name": "Pomada Modeladora Base Agua Efecto Mate 100g",
        "slug": "mac-gregor-pomada-modeladora-mate-100g",
        "description": "Fijación fuerte y acabado natural sin brillo. Se reactiva con agua y no deja residuos en el cabello.",
        "base_price": 5900.00,
        "is_featured": False,
        "is_on_sale": True,
        "sale_price": 5200.00,
        "image_urls": ["https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "MG-POM-MATE", "variant_name": "Mate Fuerte (100g)", "price_override": 5200.00, "stock": 25, "is_active": True},
            {"sku": "MG-POM-BRILLO", "variant_name": "Brillo Clásico (100g)", "price_override": 5200.00, "stock": 14, "is_active": True},
        ]
    },
    {
        "subcategory_slug": "tijeras",
        "brand_slug": "escudo",
        "name": "Tijera de Pulir Microdentada Profesional 5.5\"",
        "slug": "escudo-tijera-pulir-microdentada-55",
        "description": "Tijera de precisión para descargar volumen y texturizar. Forjada en acero inoxidable japonés con filo de larga duración y apoyo de dedo extraíble.",
        "base_price": 14500.00,
        "is_featured": False,
        "is_on_sale": False,
        "sale_price": None,
        "image_urls": ["https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"],
        "is_active": True,
        "variants": [
            {"sku": "ESC-TIJ-55", "variant_name": "5.5 pulgadas (Acero Inoxidable)", "price_override": None, "stock": 10, "is_active": True},
        ]
    },
]


from typing import Any, Dict, List, Optional


def _as_dict_list(data: Any) -> List[Dict[str, Any]]:
    """Convierte de forma segura el payload de PostgREST en una lista de diccionarios."""
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []


def _as_first_dict(data: Any) -> Optional[Dict[str, Any]]:
    """Obtiene de forma segura el primer diccionario de un payload de PostgREST."""
    if isinstance(data, list) and data and isinstance(data[0], dict):
        return data[0]
    if isinstance(data, dict):
        return data
    return None


def seed_sample_products():
    print("\n========================================================")
    print("[*] INSERCIÓN DE PRODUCTOS SEMILLA EN SUPABASE")
    print("========================================================\n")

    client = get_supabase_client()

    # 1. Mapear subcategorías y marcas por slug para obtener sus IDs
    subcats_res = client.table("subcategories").select("id, slug").execute()
    subcats_rows = _as_dict_list(subcats_res.data)
    subcats_map: Dict[str, str] = {
        str(s["slug"]): str(s["id"]) for s in subcats_rows if "slug" in s and "id" in s
    }

    brands_res = client.table("brands").select("id, slug").execute()
    brands_rows = _as_dict_list(brands_res.data)
    brands_map: Dict[str, str] = {
        str(b["slug"]): str(b["id"]) for b in brands_rows if "slug" in b and "id" in b
    }

    print(f"[INFO] Subcategorías indexadas: {len(subcats_map)}")
    print(f"[INFO] Marcas indexadas: {len(brands_map)}")

    inserted_products = 0
    inserted_variants = 0

    for prod_data in SAMPLE_PRODUCTS:
        subcat_id = subcats_map.get(str(prod_data["subcategory_slug"]))
        brand_id = brands_map.get(str(prod_data["brand_slug"]))

        if not subcat_id:
            print(f"[WARN] Subcategoría '{prod_data['subcategory_slug']}' no encontrada. Saltando producto {prod_data['name']}.")
            continue
        if not brand_id:
            print(f"[WARN] Marca '{prod_data['brand_slug']}' no encontrada. Saltando producto {prod_data['name']}.")
            continue

        product_payload = {
            "subcategory_id": subcat_id,
            "brand_id": brand_id,
            "name": prod_data["name"],
            "slug": prod_data["slug"],
            "description": prod_data["description"],
            "base_price": prod_data["base_price"],
            "is_featured": prod_data["is_featured"],
            "is_on_sale": prod_data["is_on_sale"],
            "sale_price": prod_data["sale_price"],
            "image_urls": prod_data["image_urls"],
            "is_active": prod_data["is_active"],
        }

        # Upsert producto por slug
        res = client.table("products").upsert(product_payload, on_conflict="slug").execute()
        prod_row = _as_first_dict(res.data)
        if not prod_row or "id" not in prod_row:
            print(f"[ERROR] No se pudo insertar/actualizar {prod_data['name']}")
            continue

        product_id = prod_row["id"]
        inserted_products += 1
        print(f"[OK] Producto: {prod_data['name']} (ID: {product_id})")

        # Upsert variantes
        raw_variants = prod_data.get("variants")
        variants_list = raw_variants if isinstance(raw_variants, list) else []
        for var_item in variants_list:
            if not isinstance(var_item, dict):
                continue
            variant_payload = {
                "product_id": product_id,
                "sku": var_item["sku"],
                "variant_name": var_item["variant_name"],
                "price_override": var_item["price_override"],
                "stock": var_item["stock"],
                "is_active": var_item["is_active"],
            }
            var_res = client.table("product_variants").upsert(variant_payload, on_conflict="sku").execute()
            if var_res.data:
                inserted_variants += 1
                print(f"     -> Variante: {var_item['sku']} ({var_item['variant_name']}) - Stock: {var_item['stock']}")

    print(f"\n========================================================")
    print(f"[EXITO] Total productos cargados/actualizados: {inserted_products}/{len(SAMPLE_PRODUCTS)}")
    print(f"[EXITO] Total variantes cargadas/actualizadas: {inserted_variants}")
    print("========================================================\n")


if __name__ == "__main__":
    seed_sample_products()
