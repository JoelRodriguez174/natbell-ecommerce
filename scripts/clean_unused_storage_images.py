"""Script para auditar y eliminar imágenes huérfanas en Supabase Storage.

Identifica todas las imágenes almacenadas en el bucket 'products' de Supabase
que NO estén referenciadas en ninguna tabla de la base de datos (products, categories, brands).
"""

import argparse
import os
import sys
import time
from typing import Any, Dict, List, Set
from dotenv import load_dotenv
from supabase import create_client, Client

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Cargar variables de entorno del backend
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env")
load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


def extract_storage_path(url: str) -> str | None:
    """Extrae la ruta relativa dentro del bucket 'products' a partir de una URL."""
    if not isinstance(url, str):
        return None
    cleaned = url.split("?")[0].split("#")[0].strip()
    if "/storage/v1/object/public/products/" in cleaned:
        return cleaned.split("/storage/v1/object/public/products/")[-1].strip("/")
    elif cleaned.startswith("/products/"):
        return cleaned[len("/products/"):].strip("/")
    elif "/products/" in cleaned and "supabase.co" in cleaned:
        return cleaned.split("/products/")[-1].strip("/")
    return None


def get_used_storage_paths(client: Client) -> Set[str]:
    """Obtiene todos los paths de Supabase Storage en uso en la base de datos."""
    used_paths: Set[str] = set()

    # 1. Productos
    prods = client.table("products").select("id, name, image_urls").execute()
    for p in prods.data or []:
        for url in p.get("image_urls") or []:
            path = extract_storage_path(url)
            if path:
                used_paths.add(path)

    # 2. Categorías
    cats = client.table("categories").select("id, name, image_url").execute()
    for c in cats.data or []:
        url = c.get("image_url")
        if url:
            path = extract_storage_path(url)
            if path:
                used_paths.add(path)

    # 3. Marcas
    brands = client.table("brands").select("id, name, logo_url").execute()
    for b in brands.data or []:
        url = b.get("logo_url")
        if url:
            path = extract_storage_path(url)
            if path:
                used_paths.add(path)

    return used_paths


def get_all_storage_files(client: Client, bucket_name: str = "products") -> List[Dict[str, Any]]:
    """Lista todos los archivos en el bucket de forma paginada y recursiva."""
    all_files: List[Dict[str, Any]] = []
    limit = 100
    offset = 0
    folders: List[str] = []

    # Nivel raíz
    while True:
        items = client.storage.from_(bucket_name).list("", {"limit": limit, "offset": offset})
        if not items:
            break
        for it in items:
            name = it.get("name")
            metadata = it.get("metadata")
            if metadata is not None and metadata.get("size") is not None:
                all_files.append({
                    "path": name,
                    "size": metadata.get("size", 0),
                    "name": name,
                })
            else:
                folders.append(name)
        if len(items) < limit:
            break
        offset += limit

    # Subcarpetas
    for folder in folders:
        f_offset = 0
        while True:
            sub_items = client.storage.from_(bucket_name).list(folder, {"limit": limit, "offset": f_offset})
            if not sub_items:
                break
            for sit in sub_items:
                s_name = sit.get("name")
                full_path = f"{folder}/{s_name}"
                s_meta = sit.get("metadata") or {}
                all_files.append({
                    "path": full_path,
                    "size": s_meta.get("size", 0),
                    "name": s_name,
                })
            if len(sub_items) < limit:
                break
            f_offset += limit

    return all_files


def main():
    parser = argparse.ArgumentParser(description="Limpiar imágenes huérfanas en Supabase Storage.")
    parser.add_argument("--dry-run", action="store_true", help="Auditar sin borrar archivos reales.")
    parser.add_argument("--bucket", default="products", help="Nombre del bucket (default: products)")
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: SUPABASE_URL o SUPABASE_SERVICE_KEY no definidos en backend/.env")
        sys.exit(1)

    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("=" * 70)
    print(f"🧹 AUDITORÍA DE SUPABASE STORAGE — BUCKET: '{args.bucket}'")
    print("=" * 70)

    # 1. Obtener archivos en uso en BD
    used_paths = get_used_storage_paths(client)
    print(f"📦 Total de imágenes en uso registradas en la Base de Datos: {len(used_paths)}")

    if len(used_paths) == 0:
        print("⚠️  ALERTA DE SEGURIDAD: No se encontraron imágenes en uso en la BD.")
        print("   Por seguridad, el script se detiene para evitar borrar todo el almacenamiento.")
        sys.exit(1)

    # 2. Obtener todos los archivos del bucket
    print("⏳ Escaneando archivos en Supabase Storage...")
    storage_files = get_all_storage_files(client, args.bucket)
    print(f"📂 Total de archivos encontrados en Storage: {len(storage_files)}")

    # 3. Clasificar
    to_delete: List[Dict[str, Any]] = []
    to_keep: List[Dict[str, Any]] = []

    for f in storage_files:
        path = f["path"]
        if path in used_paths:
            to_keep.append(f)
        else:
            to_delete.append(f)

    total_bytes_to_delete = sum(f.get("size", 0) for f in to_delete)
    mb_to_delete = round(total_bytes_to_delete / (1024 * 1024), 2)

    print("\n" + "-" * 70)
    print("📊 RESULTADO DE LA AUDITORÍA:")
    print(f"  ✅ Archivos en uso activo (SE CONSERVAN): {len(to_keep)}")
    print(f"  🗑️  Archivos huérfanos sin uso (A ELIMINAR): {len(to_delete)} (~{mb_to_delete} MB)")
    print("-" * 70)

    if not to_delete:
        print("\n🎉 ¡El bucket ya está 100% limpio! No hay imágenes huérfanas.")
        return

    # Si es dry-run
    if args.dry_run:
        print("\n🔍 [DRY-RUN] Modo de prueba activo. Ningún archivo fue eliminado.")
        print("Primeros 15 archivos que serían eliminados:")
        for f in to_delete[:15]:
            print(f"   - {f['path']} ({round(f.get('size', 0)/1024, 1)} KB)")
        if len(to_delete) > 15:
            print(f"   ... y {len(to_delete) - 15} archivos más.")
        print("\nPara ejecutar la eliminación definitiva, ejecutá sin --dry-run")
        return

    # Ejecutar eliminación en chunks de 50
    print(f"\n🚀 Iniciando eliminación física de {len(to_delete)} archivos huérfanos...")
    start_time = time.time()
    chunk_size = 50
    deleted_count = 0
    error_count = 0

    all_paths_to_delete = [f["path"] for f in to_delete]

    for i in range(0, len(all_paths_to_delete), chunk_size):
        chunk = all_paths_to_delete[i:i + chunk_size]
        try:
            client.storage.from_(args.bucket).remove(chunk)
            deleted_count += len(chunk)
            print(f"  ✔️ Eliminados {deleted_count}/{len(all_paths_to_delete)} archivos...")
        except Exception as exc:
            error_count += len(chunk)
            print(f"  ❌ Error eliminando chunk {i}-{i+chunk_size}: {exc}")

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 70)
    print("🎉 LIMPIEZA FINALIZADA")
    print(f"⏱️  Tiempo: {elapsed} segundos")
    print(f"🗑️  Archivos eliminados exitosamente: {deleted_count}")
    if error_count > 0:
        print(f"⚠️  Archivos con error: {error_count}")
    print(f"💾 Espacio liberado estimado: ~{mb_to_delete} MB")
    print(f"✅ Archivos restantes en uso en el bucket: {len(to_keep)}")
    print("=" * 70)


if __name__ == "__main__":
    main()
