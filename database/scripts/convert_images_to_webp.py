import os
import sys
from PIL import Image, ImageOps

# Forzar UTF-8 en stdout para terminales Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        getattr(sys.stdout, "reconfigure")(encoding="utf-8")
    except Exception:
        pass

TARGET_EXTS = {".jpg", ".jpeg", ".jfif", ".png"}

def convert_image(src_path: str) -> bool:
    base, _ = os.path.splitext(src_path)
    dest_path = f"{base}.webp"

    try:
        with Image.open(src_path) as img:
            # Corregir orientación EXIF si está presente
            img = ImageOps.exif_transpose(img)

            # Manejar modos de color
            if img.mode in ("RGBA", "LA"):
                # Preservar canal alfa (transparencia)
                save_kwargs = {"format": "WEBP", "lossless": True}
            elif img.mode == "P":
                if "transparency" in img.info:
                    img = img.convert("RGBA")
                    save_kwargs = {"format": "WEBP", "lossless": True}
                else:
                    img = img.convert("RGB")
                    save_kwargs = {"format": "WEBP", "quality": 85, "method": 6}
            elif img.mode == "CMYK":
                img = img.convert("RGB")
                save_kwargs = {"format": "WEBP", "quality": 85, "method": 6}
            elif img.mode == "RGB":
                save_kwargs = {"format": "WEBP", "quality": 85, "method": 6}
            else:
                img = img.convert("RGB")
                save_kwargs = {"format": "WEBP", "quality": 85, "method": 6}

            img.save(dest_path, **save_kwargs)

        # Verificar que el nuevo archivo webp se haya generado correctamente
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
            os.remove(src_path)
            return True
        else:
            print(f"[ERROR] Archivo destino vacío o no creado: {dest_path}")
            return False
    except Exception as e:
        print(f"[ERROR] Fallo al procesar {src_path}: {e}")
        return False


def main():
    root_dir = "img"
    if not os.path.exists(root_dir):
        print(f"[ERROR] Directorio '{root_dir}' no encontrado.")
        return

    print("========================================================")
    print("[*] CONVERSIÓN DE IMÁGENES A WEBP Y REEMPLAZO DE ORIGINALES")
    print("========================================================\n")

    # Calcular tamaño inicial
    initial_size = 0
    to_convert = []

    for dirpath, _, filenames in os.walk(root_dir):
        for f in filenames:
            ext = os.path.splitext(f)[1].lower()
            full_path = os.path.join(dirpath, f)
            initial_size += os.path.getsize(full_path)
            if ext in TARGET_EXTS:
                to_convert.append(full_path)

    total_files = len(to_convert)
    print(f"[INFO] Archivos a convertir a WebP: {total_files}")
    print(f"[INFO] Tamaño inicial de la carpeta '{root_dir}': {initial_size / (1024 * 1024):.2f} MB\n")

    success_count = 0
    failed_count = 0

    for idx, file_path in enumerate(to_convert, 1):
        if convert_image(file_path):
            success_count += 1
            if idx % 50 == 0 or idx == total_files:
                print(f"[{idx}/{total_files}] Convertidas y reemplazadas...")
        else:
            failed_count += 1

    # Calcular tamaño final
    final_size = sum(
        os.path.getsize(os.path.join(dirpath, f))
        for dirpath, _, filenames in os.walk(root_dir)
        for f in filenames
    )

    saved_mb = (initial_size - final_size) / (1024 * 1024)
    reduction_pct = ((initial_size - final_size) / initial_size) * 100 if initial_size > 0 else 0

    print("\n========================================================")
    print(f"[EXITO] Total convertidas y reemplazadas: {success_count}/{total_files}")
    if failed_count > 0:
        print(f"[WARN] Fallidas: {failed_count}")
    print(f"[INFO] Tamaño inicial: {initial_size / (1024 * 1024):.2f} MB")
    print(f"[INFO] Tamaño final:   {final_size / (1024 * 1024):.2f} MB")
    print(f"[INFO] Espacio ahorrado: {saved_mb:.2f} MB ({reduction_pct:.1f}% de reducción)")
    print("========================================================\n")


if __name__ == "__main__":
    main()
