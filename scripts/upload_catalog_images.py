#!/usr/bin/env python3
"""
Script de subida masiva de imágenes de catálogo a Supabase Storage.
Proyecto: Natbell E-commerce (Los Arrayanes)

Uso:
  python scripts/upload_catalog_images.py [--brand NOV] [--limit 10] [--dry-run] [--update-db]
"""

import argparse
import contextlib
import os
import re
import sys
import time
import unicodedata
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

# Rutas base
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / "backend" / ".env"
IMG_BASE_DIR = PROJECT_ROOT / "img"

# Asegurar codificación utf-8 en terminales de Windows
if sys.platform == "win32":
    with contextlib.suppress(Exception):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

load_dotenv(dotenv_path=ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")


def sanitize_folder_name(name: str) -> str:
    """Normaliza el nombre de la carpeta/marca."""
    clean = re.sub(r"^\d+\s*[-_.]*\s*", "", name)
    clean = unicodedata.normalize("NFKD", clean).encode("ascii", "ignore").decode("ascii")
    clean = re.sub(r"[^\w-]", "_", clean).lower()
    clean = re.sub(r"_+", "_", clean)
    return clean.strip("._-")


def sanitize_file_name(name: str) -> str:
    """Normaliza el nombre del archivo manteniendo códigos y SKU."""
    if "." in name:
        stem, ext = name.rsplit(".", 1)
        ext = ext.lower()
    else:
        stem, ext = name, ""
    clean_stem = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode("ascii")
    clean_stem = re.sub(r"[^\w-]", "_", clean_stem).lower()
    clean_stem = re.sub(r"_+", "_", clean_stem).strip("._-")
    return f"{clean_stem}.{ext}" if ext else clean_stem


def get_content_type(file_path: Path) -> str:
    ext = file_path.suffix.lower()
    if ext == ".webp":
        return "image/webp"
    if ext in (".jpg", ".jpeg"):
        return "image/jpeg"
    if ext == ".png":
        return "image/png"
    return "application/octet-stream"


def find_images_directory() -> Path | None:
    """Localiza la subcarpeta donde residen las carpetas de marcas."""
    candidates = list(IMG_BASE_DIR.glob("**/00A LOS ARRAYANES IMAGENES PRODUCTOS"))
    if candidates:
        for c in candidates:
            if c.is_dir() and any(c.iterdir()):
                return c
    # Fallback si no encuentra el subdirectorio anidado
    return IMG_BASE_DIR


def ensure_bucket_exists(client: Client, bucket_name: str) -> None:
    """Verifica la existencia del bucket y lo crea como público si no existe."""
    try:
        buckets = client.storage.list_buckets()
        existing = [b.id for b in buckets if hasattr(b, "id")] or [b.name for b in buckets if hasattr(b, "name")]
        if bucket_name not in existing:
            print(f"📦 Creando bucket público '{bucket_name}'...")
            client.storage.create_bucket(bucket_name, options={"public": True})
            print(f"✅ Bucket '{bucket_name}' creado exitosamente.")
        else:
            print(f"✅ Bucket '{bucket_name}' listo y verificado.")
    except Exception as exc:  # noqa: BLE001
        print(f"⚠️  Advertencia verificando bucket: {exc} (se intentará subir de todas formas).")


def collect_images(
    root_dir: Path, brand_filter: str | None = None
) -> list[tuple[Path, str, str]]:
    """Recolecta imágenes válidas: (path_absoluto, carpeta_marca_limpia, filename_limpio)."""
    valid_exts = {".webp", ".jpg", ".jpeg", ".png"}
    collected: list[tuple[Path, str, str]] = []

    # Recorrer carpetas de primer nivel
    for item in sorted(root_dir.iterdir()):
        if not item.is_dir():
            continue

        raw_folder_name = item.name
        folder_clean = sanitize_folder_name(raw_folder_name)

        if brand_filter and brand_filter.lower() not in folder_clean and brand_filter.lower() not in raw_folder_name.lower():
            continue

        for file_path in sorted(item.glob("**/*")):
            if file_path.is_file() and file_path.suffix.lower() in valid_exts:
                # Omitir archivos de sistema ocultos
                if file_path.name.startswith("."):
                    continue
                file_clean = sanitize_file_name(file_path.name)
                collected.append((file_path, folder_clean, file_clean))

    return collected


def main():
    parser = argparse.ArgumentParser(description="Subida masiva de imágenes a Supabase Storage.")
    parser.add_argument("--brand", type=str, default=None, help="Filtrar por marca/carpeta (ej: 'NOV' o '01 NOV')")
    parser.add_argument("--limit", type=int, default=None, help="Límite de imágenes a procesar (para pruebas)")
    parser.add_argument("--dry-run", action="store_true", help="Simular la subida sin enviar datos a Supabase")
    parser.add_argument("--bucket", type=str, default="products", help="Nombre del bucket de destino (por defecto 'products')")
    parser.add_argument("--update-db", action="store_true", help="Intentar asociar URLs subidas a productos en la BD")

    args = parser.parse_args()

    print("=" * 70)
    print("🚀 SCRIPT DE SUBIDA DE IMÁGENES A SUPABASE STORAGE — NATBELL")
    print("=" * 70)

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ ERROR: SUPABASE_URL o SUPABASE_SERVICE_KEY no están definidas en backend/.env")
        sys.exit(1)

    images_dir = find_images_directory()
    if not images_dir or not images_dir.exists():
        print(f"❌ ERROR: No se encontró la carpeta de imágenes en {IMG_BASE_DIR}")
        sys.exit(1)

    print(f"📁 Directorio de origen: {images_dir}")
    print(f"🎯 Bucket de destino: '{args.bucket}'")
    if args.brand:
        print(f"🔍 Filtro de marca: '{args.brand}'")
    if args.limit:
        print(f"🔢 Límite: {args.limit} archivos")
    if args.dry_run:
        print("⚠️  MODO DRY-RUN ACTIVADO: No se realizarán subidas reales.")
    print("-" * 70)

    # Conexión Supabase
    client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    if not args.dry_run:
        ensure_bucket_exists(client, args.bucket)

    # Recolectar archivos
    items = collect_images(images_dir, brand_filter=args.brand)
    total_found = len(items)

    if total_found == 0:
        print("⚠️  No se encontraron imágenes con los filtros especificados.")
        sys.exit(0)

    if args.limit:
        items = items[: args.limit]

    print(f"📦 Se procesarán {len(items)} imágenes (de {total_found} encontradas)...\n")

    uploaded_count = 0
    error_count = 0
    uploaded_map: dict[str, str] = {}  # {storage_path: public_url}

    start_time = time.time()

    for idx, (file_path, folder_clean, file_clean) in enumerate(items, 1):
        storage_path = f"{folder_clean}/{file_clean}"
        content_type = get_content_type(file_path)

        if args.dry_run:
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{args.bucket}/{storage_path}"
            print(f"[{idx}/{len(items)}] [DRY-RUN] {storage_path} ({content_type})")
            uploaded_count += 1
            uploaded_map[file_clean] = public_url
            continue

        try:
            with open(file_path, "rb") as f:
                file_bytes = f.read()

            client.storage.from_(args.bucket).upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"},
            )

            public_url = client.storage.from_(args.bucket).get_public_url(storage_path)
            uploaded_map[file_clean] = public_url
            uploaded_count += 1
            print(f"[{idx}/{len(items)}] ✅ {storage_path} -> {public_url}")

        except Exception as exc:  # noqa: BLE001
            error_count += 1
            print(f"[{idx}/{len(items)}] ❌ Error subiendo {storage_path}: {exc}")

    elapsed = round(time.time() - start_time, 2)

    print("\n" + "=" * 70)
    print("📊 RESUMEN DE PROCESAMIENTO")
    print("=" * 70)
    print(f"⏱️  Tiempo total: {elapsed} segundos")
    print(f"✅ Subidas con éxito: {uploaded_count}")
    if error_count > 0:
        print(f"❌ Errores: {error_count}")

    # Actualización opcional en BD
    if args.update_db and uploaded_map and not args.dry_run:
        print("\n🔄 Actualizando URLs en la base de datos...")
        try:
            res = client.table("products").select("id, name, slug, image_urls").execute()
            products = res.data or []
            updated_prods = 0

            for p in products:
                prod_slug = p.get("slug", "")
                prod_name = p.get("name", "").lower()
                current_imgs = p.get("image_urls") or []

                # Buscar coincidencias en las fotos subidas
                matched_url = None
                for filename, url in uploaded_map.items():
                    slug_core = prod_slug.replace("-", "_")
                    name_words = [w for w in re.split(r"\W+", prod_name) if len(w) > 3]

                    if slug_core in filename or any(w in filename for w in name_words[:3]):
                        matched_url = url
                        break

                if matched_url and (not current_imgs or current_imgs[0].startswith("/products/")):
                    client.table("products").update({"image_urls": [matched_url]}).eq("id", p["id"]).execute()
                    print(f"  ✨ Producto '{p.get('name')}' actualizado con: {matched_url}")
                    updated_prods += 1

            print(f"🎉 {updated_prods} productos actualizados con imágenes de Supabase Storage.")
        except Exception as exc:  # noqa: BLE001
            print(f"⚠️  Error actualizando base de datos: {exc}")

    print("\n✨ Proceso finalizado.")


if __name__ == "__main__":
    main()
