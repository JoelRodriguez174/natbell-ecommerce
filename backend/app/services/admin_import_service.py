import csv
import difflib
import io
import logging
import re
import unicodedata
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from supabase import Client

from app.models.admin_catalog import AdminImportSummary
from app.services.admin_catalog_service import AdminCatalogService
from app.utils.cache import global_cache
from app.utils.postgrest import as_dict_list as _as_dict_list
from app.utils.postgrest import as_first_dict as _as_first_dict
from app.utils.slug import slugify

logger = logging.getLogger(__name__)

# Mapeo de cabeceras reconocidas hacia claves canónicas
HEADER_ALIASES: Dict[str, str] = {
    # Producto
    "nombre": "nombre",
    "producto": "nombre",
    "nombre_producto": "nombre",
    "titulo": "nombre",
    "title": "nombre",
    "name": "nombre",
    "descripcion": "descripcion",
    "detalle": "descripcion",
    "description": "descripcion",
    "categoria": "categoria",
    "categoria_principal": "categoria",
    "category": "categoria",
    "subcategoria": "subcategoria",
    "subcategory": "subcategoria",
    "rubro": "subcategoria",
    "marca": "marca",
    "brand": "marca",
    "precio_base": "precio_base",
    "precio": "precio_base",
    "precio_lista": "precio_base",
    "price": "precio_base",
    "base_price": "precio_base",
    "precio_oferta": "precio_oferta",
    "precio_promocional": "precio_oferta",
    "oferta": "precio_oferta",
    "sale_price": "precio_oferta",
    "en_oferta": "en_oferta",
    "is_on_sale": "en_oferta",
    "destacado": "destacado",
    "is_featured": "destacado",
    "activo": "activo",
    "is_active": "activo",
    "imagenes": "imagenes",
    "imagen": "imagenes",
    "fotos": "imagenes",
    "foto": "imagenes",
    "image_urls": "imagenes",
    "images": "imagenes",
    # Variante
    "sku": "sku_variante",
    "sku_variante": "sku_variante",
    "codigo": "sku_variante",
    "codigo_sku": "sku_variante",
    "nombre_variante": "nombre_variante",
    "variante": "nombre_variante",
    "variant_name": "nombre_variante",
    "presentacion": "nombre_variante",
    "talle": "nombre_variante",
    "color": "nombre_variante",
    "precio_variante": "precio_variante",
    "price_override": "precio_variante",
    "stock": "stock_variante",
    "stock_variante": "stock_variante",
    "stock_inicial": "stock_variante",
    "cantidad": "stock_variante",
}

TEMPLATE_HEADERS = [
    ("nombre", "Nombre del Producto *", 35),
    ("descripcion", "Descripción", 40),
    ("categoria", "Categoría", 22),
    ("subcategoria", "Subcategoría", 22),
    ("marca", "Marca", 22),
    ("precio_base", "Precio Base *", 16),
    ("precio_oferta", "Precio Oferta", 16),
    ("en_oferta", "En Oferta (SI/NO)", 18),
    ("destacado", "Destacado (SI/NO)", 18),
    ("activo", "Activo (SI/NO)", 16),
    ("sku_variante", "SKU Variante", 20),
    ("nombre_variante", "Nombre Variante", 22),
    ("precio_variante", "Precio Variante", 18),
    ("stock_variante", "Stock", 14),
    ("imagenes", "Imágenes (URLs separadas por comas)", 45),
]

SAMPLE_ROWS = [
    [
        "Shampoo Reparación Absoluta 500ml",
        "Tratamiento reconstructor intensivo para cabello dañado con lípidos y ceramidas.",
        "Cuidado Capilar",
        "Shampoos",
        "L'Oréal Professionnel",
        18500.0,
        16900.0,
        "SI",
        "SI",
        "SI",
        "LOR-SHP-500",
        "500 ml",
        "",
        25,
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800",
    ],
    [
        "Máscara Nutritiva Profunda 250g",
        "Tratamiento ultra hidratante a base de aceite de argán para recuperar la suavidad.",
        "Cuidado Capilar",
        "Tratamientos",
        "Nov",
        14200.0,
        "",
        "NO",
        "NO",
        "SI",
        "NOV-MASK-250",
        "250 gr",
        "",
        40,
        "",
    ],
    [
        "Esmalte Gel Semipermanente",
        "Brillo espejo de secado rápido en cabina UV/LED con duración de 21 días.",
        "Uñas",
        "Esmaltes",
        "Plasma",
        6500.0,
        "",
        "NO",
        "NO",
        "SI",
        "PLS-ESM-ROJO",
        "Rojo Pasión",
        "",
        15,
        "",
    ],
]


def _strip_accents(text: str) -> str:
    """Elimina acentos y diacríticos de un string."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )


def _clean_token(text: str) -> str:
    """Normaliza un texto eliminando acentos, caracteres especiales, guiones y signos de puntuación."""
    norm = _strip_accents(str(text or "").strip().lower())
    return re.sub(r"[^a-z0-9]+", "", norm)


def _fuzzy_match(query: str, target: str, min_ratio: float = 0.85) -> bool:
    """Determina si dos nombres coinciden ignorando mayúsculas, acentos, puntuación o pequeñas variaciones."""
    q_c = _clean_token(query)
    t_c = _clean_token(target)
    if not q_c or not t_c:
        return False
    if q_c == t_c:
        return True
    # Plurales o subpalabras incluidas si tienen longitud razonable (>= 4 caracteres)
    if len(q_c) >= 4 and len(t_c) >= 4 and (q_c in t_c or t_c in q_c):
        return True
    ratio = difflib.SequenceMatcher(None, q_c, t_c).ratio()
    return ratio >= min_ratio


def _normalize_key(header: Any) -> str:
    """Normaliza un encabezado de columna eliminando acentos, caracteres raros y espacios."""
    if not header:
        return ""
    cleaned = _strip_accents(str(header).strip().lower())
    cleaned = re.sub(r"[^a-z0-9_]+", "_", cleaned).strip("_")
    return HEADER_ALIASES.get(cleaned, cleaned)


def _to_bool(val: Any, default: bool = False) -> bool:
    """Interpreta booleanos en español/inglés (SI, NO, 1, 0, TRUE, FALSE)."""
    if val is None or val == "":
        return default
    s = str(val).strip().lower()
    if s in {"si", "s", "yes", "y", "true", "1", "verdadero"}:
        return True
    if s in {"no", "n", "false", "0", "falso"}:
        return False
    return default


def _to_decimal(val: Any) -> Optional[Decimal]:
    """Convierte un valor numérico/cadena a Decimal seguro."""
    if val is None or str(val).strip() == "":
        return None
    try:
        cleaned = str(val).strip().replace("$", "").replace(" ", "").replace(",", ".")
        return Decimal(cleaned)
    except Exception:
        return None


def _to_int(val: Any, default: int = 0) -> int:
    """Convierte un valor a int seguro."""
    if val is None or str(val).strip() == "":
        return default
    try:
        return int(float(str(val).strip()))
    except Exception:
        return default


class AdminImportService:
    def __init__(self, db: Client):
        self.db = db
        self.catalog_service = AdminCatalogService(db)

    # -------------------------------------------------------------------------
    # GENERADOR DE PLANTILLAS
    # -------------------------------------------------------------------------
    @classmethod
    def generate_template(cls, file_format: str = "xlsx") -> bytes:
        """Genera el contenido binario de la plantilla oficial de importación en formato XLSX o CSV."""
        format_lower = file_format.lower().strip()
        if format_lower == "csv":
            return cls._generate_csv_template()
        return cls._generate_xlsx_template()

    @classmethod
    def _generate_xlsx_template(cls) -> bytes:
        wb = Workbook()
        ws = wb.active
        ws.title = "Productos Natbell"

        # Estilos visuales elegantes
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
        header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

        sample_font = Font(name="Calibri", size=10, color="1E293B")
        sample_align = Alignment(vertical="center")
        thin_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="thin", color="CBD5E1"),
        )

        # Fila 1: Encabezados
        ws.row_dimensions[1].height = 28
        for col_idx, (_, header_label, col_width) in enumerate(TEMPLATE_HEADERS, start=1):
            cell = ws.cell(row=1, column=col_idx, value=header_label)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_align
            cell.border = thin_border
            ws.column_dimensions[get_column_letter(col_idx)].width = col_width

        # Filas 2..N: Datos de ejemplo
        for row_idx, sample_row in enumerate(SAMPLE_ROWS, start=2):
            ws.row_dimensions[row_idx].height = 20
            for col_idx, val in enumerate(sample_row, start=1):
                cell = ws.cell(row=row_idx, column=col_idx, value=val)
                cell.font = sample_font
                cell.alignment = sample_align
                cell.border = thin_border

        # Inmovilizar la fila de encabezados
        ws.freeze_panes = "A2"

        output = io.BytesIO()
        wb.save(output)
        return output.getvalue()

    @classmethod
    def _generate_csv_template(cls) -> bytes:
        output = io.StringIO()
        # Header canonical names for CSV to ensure unambiguous parsing
        headers = [col[0] for col in TEMPLATE_HEADERS]
        writer = csv.writer(output, delimiter=",", quoting=csv.QUOTE_MINIMAL)
        writer.writerow(headers)
        for row in SAMPLE_ROWS:
            writer.writerow(row)

        # UTF-8 con BOM para perfecta compatibilidad con Excel Windows
        return output.getvalue().encode("utf-8-sig")

    # -------------------------------------------------------------------------
    # PARSER DE ARCHIVOS
    # -------------------------------------------------------------------------
    def _parse_rows_from_bytes(self, file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        """Extrae filas como diccionarios estructurados a partir de un archivo XLSX o CSV."""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext in {"xlsx", "xlsm", "xltx"}:
            return self._parse_xlsx(file_bytes)
        elif ext in {"csv", "txt"}:
            return self._parse_csv(file_bytes)
        else:
            raise ValueError(f"Extensión .{ext} no soportada. Solo se admiten archivos .xlsx y .csv")

    def _parse_xlsx(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        wb = load_workbook(io.BytesIO(file_bytes), data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            return []

        # Encabezados en primera fila no vacía
        header_row_idx = 0
        while header_row_idx < len(rows) and not any(rows[header_row_idx]):
            header_row_idx += 1

        if header_row_idx >= len(rows):
            return []

        raw_headers = rows[header_row_idx]
        normalized_headers = [_normalize_key(h) for h in raw_headers]

        data_rows: List[Dict[str, Any]] = []
        for r in rows[header_row_idx + 1:]:
            # Ignorar filas totalmente vacías
            if not any(r):
                continue
            row_dict: Dict[str, Any] = {}
            for col_idx, key in enumerate(normalized_headers):
                if key and col_idx < len(r):
                    val = r[col_idx]
                    row_dict[key] = val if val is not None else ""
            if row_dict:
                data_rows.append(row_dict)

        return data_rows

    def _parse_csv(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        # Decodificación resiliente
        text = None
        for enc in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
            try:
                text = file_bytes.decode(enc)
                break
            except UnicodeDecodeError:
                continue

        if text is None:
            text = file_bytes.decode("utf-8", errors="ignore")

        # Detectar delimitador (coma o punto y coma)
        sample = text[:2048]
        delimiter = ";" if sample.count(";") > sample.count(",") else ","

        reader = csv.reader(io.StringIO(text), delimiter=delimiter)
        rows = list(reader)
        if not rows:
            return []

        header_row = rows[0]
        normalized_headers = [_normalize_key(h) for h in header_row]

        data_rows: List[Dict[str, Any]] = []
        for r in rows[1:]:
            if not any(r):
                continue
            row_dict: Dict[str, Any] = {}
            for col_idx, key in enumerate(normalized_headers):
                if key and col_idx < len(r):
                    row_dict[key] = r[col_idx].strip()
            if row_dict:
                data_rows.append(row_dict)

        return data_rows

    # -------------------------------------------------------------------------
    # LOOKUPS & ENTIDAD TAXONOMÍA
    # -------------------------------------------------------------------------
    def _load_taxonomies(self) -> Dict[str, Any]:
        """Carga en memoria categorías, subcategorías y marcas activas para resolución rápida."""
        cat_res = self.db.table("categories").select("id, name, slug").execute()
        categories = _as_dict_list(cat_res.data) if cat_res else []

        sub_res = self.db.table("subcategories").select("id, category_id, name, slug").execute()
        subcategories = _as_dict_list(sub_res.data) if sub_res else []

        brand_res = self.db.table("brands").select("id, name, slug").execute()
        brands = _as_dict_list(brand_res.data) if brand_res else []

        return {
            "categories": categories,
            "subcategories": subcategories,
            "brands": brands,
        }

    def _resolve_brand_id(self, brand_name: str, taxonomies: Dict[str, Any]) -> str:
        """Encuentra la marca por nombre/slug o la crea automáticamente si no existe."""
        if not brand_name or not str(brand_name).strip():
            # Fallback a la primera marca disponible o Genérica
            if taxonomies["brands"]:
                return str(taxonomies["brands"][0]["id"])
            brand_name = "Natbell"

        clean_name = str(brand_name).strip()
        norm = _strip_accents(clean_name.lower())

        # 1. Búsqueda exacta normalizada (ignora mayúsculas y acentos)
        for b in taxonomies["brands"]:
            if _strip_accents(b["name"].lower()) == norm or b["slug"] == norm:
                return str(b["id"])

        # 2. Búsqueda difusa / tolerante a puntuación (ej. "L'Oréal" vs "Loreal", "la-puissance" vs "la puissance")
        for b in taxonomies["brands"]:
            if _fuzzy_match(clean_name, b["name"]) or _fuzzy_match(clean_name, b.get("slug", "")):
                return str(b["id"])

        # Crear marca automáticamente
        brand_slug = slugify(clean_name) or "marca"
        new_brand_record = {
            "name": clean_name,
            "slug": brand_slug,
            "is_active": True,
        }
        res = self.db.table("brands").insert(new_brand_record).execute()
        created = _as_first_dict(res.data) if res else {}
        if created and created.get("id"):
            taxonomies["brands"].append(created)
            return str(created["id"])

        # Fallback
        if taxonomies["brands"]:
            return str(taxonomies["brands"][0]["id"])
        raise RuntimeError(f"No se pudo resolver ni crear la marca: {clean_name}")

    def _resolve_subcategory_id(
        self,
        cat_name: str,
        subcat_name: str,
        taxonomies: Dict[str, Any],
    ) -> str:
        """Resuelve el subcategory_id a partir del nombre de categoría y subcategoría."""
        clean_subcat = str(subcat_name or "").strip()
        clean_cat = str(cat_name or "").strip()

        # 1. Búsqueda en subcategorías (exacta y difusa)
        if clean_subcat:
            norm_sub = _strip_accents(clean_subcat.lower())
            for s in taxonomies["subcategories"]:
                if _strip_accents(s["name"].lower()) == norm_sub or s["slug"] == norm_sub:
                    return str(s["id"])
            for s in taxonomies["subcategories"]:
                if _fuzzy_match(clean_subcat, s["name"]) or _fuzzy_match(clean_subcat, s.get("slug", "")):
                    return str(s["id"])

        # 2. Búsqueda por categoría (exacta y difusa)
        if clean_cat:
            norm_cat = _strip_accents(clean_cat.lower())
            matched_cat = None
            for c in taxonomies["categories"]:
                if _strip_accents(c["name"].lower()) == norm_cat or c["slug"] == norm_cat:
                    matched_cat = c
                    break
            if not matched_cat:
                for c in taxonomies["categories"]:
                    if _fuzzy_match(clean_cat, c["name"]) or _fuzzy_match(clean_cat, c.get("slug", "")):
                        matched_cat = c
                        break

            if matched_cat:
                cat_id = str(matched_cat["id"])
                # Obtener la primera subcategoría de esta categoría
                for s in taxonomies["subcategories"]:
                    if str(s.get("category_id")) == cat_id:
                        return str(s["id"])

                    # Si la categoría no tiene subcategorías, crear una subcategoría "General"
                    new_sub_record = {
                        "category_id": cat_id,
                        "name": f"General - {c['name']}",
                        "slug": f"general-{c['slug']}",
                        "is_active": True,
                    }
                    res = self.db.table("subcategories").insert(new_sub_record).execute()
                    created = _as_first_dict(res.data) if res else {}
                    if created and created.get("id"):
                        taxonomies["subcategories"].append(created)
                        return str(created["id"])

        # 3. Fallback a la primera subcategoría disponible en el sistema
        if taxonomies["subcategories"]:
            return str(taxonomies["subcategories"][0]["id"])

        # 4. Si no hay nada, crear una categoría y subcategoría por defecto
        default_cat_res = self.db.table("categories").insert({
            "name": "General",
            "slug": "general",
            "is_active": True,
        }).execute()
        new_cat = _as_first_dict(default_cat_res.data) if default_cat_res else {}
        new_cat_id = str(new_cat.get("id"))

        default_sub_res = self.db.table("subcategories").insert({
            "category_id": new_cat_id,
            "name": "General",
            "slug": "general-sub",
            "is_active": True,
        }).execute()
        new_sub = _as_first_dict(default_sub_res.data) if default_sub_res else {}
        return str(new_sub.get("id"))

    # -------------------------------------------------------------------------
    # EJECUCIÓN PRINCIPAL DE LA IMPORTACIÓN
    # -------------------------------------------------------------------------
    async def import_from_bytes(self, file_bytes: bytes, filename: str) -> AdminImportSummary:
        """Procesa el contenido del archivo, parsea los productos y variantes, y los persiste en Supabase."""
        rows = self._parse_rows_from_bytes(file_bytes, filename)
        if not rows:
            return AdminImportSummary(
                success=False,
                products_created=0,
                variants_created=0,
                total_rows_processed=0,
                errors=["El archivo cargado está vacío o no contiene filas de datos."],
            )

        taxonomies = self._load_taxonomies()

        products_created = 0
        variants_created = 0
        total_rows_processed = 0
        warnings: List[str] = []
        errors: List[str] = []

        # Cache de productos procesados en esta corrida para agrupar múltiples variantes
        # Clave: nombre normalizado -> product_id
        product_cache_by_name: Dict[str, str] = {}

        for row_idx, row in enumerate(rows, start=2):
            total_rows_processed += 1
            name = str(row.get("nombre") or "").strip()
            if not name:
                warnings.append(f"Fila {row_idx}: Omitida porque no contiene nombre de producto.")
                continue

            # Parsing de precios y datos numéricos
            base_price = _to_decimal(row.get("precio_base"))
            sale_price = _to_decimal(row.get("precio_oferta"))
            is_on_sale = _to_bool(row.get("en_oferta"), default=(sale_price is not None))
            is_featured = _to_bool(row.get("destacado"), default=False)
            is_active = _to_bool(row.get("activo"), default=True)

            # Imágenes
            raw_images = str(row.get("imagenes") or "").strip()
            images: List[str] = []
            if raw_images:
                split_imgs = re.split(r"[,;]+", raw_images)
                images = [url.strip() for url in split_imgs if url.strip().startswith("http")]

            # Normalizar clave de agrupación del producto
            norm_name = _strip_accents(name.lower())

            product_id: Optional[str] = product_cache_by_name.get(norm_name)

            # Si el producto no fue creado en este lote, buscar en DB o crearlo
            if not product_id:
                try:
                    # Chequear si ya existe en la base de datos por nombre
                    existing_prod_res = (
                        self.db.table("products")
                        .select("id")
                        .ilike("name", name)
                        .limit(1)
                        .execute()
                    )
                    existing_prod = _as_first_dict(existing_prod_res.data) if existing_prod_res else None

                    if existing_prod and existing_prod.get("id"):
                        product_id = str(existing_prod["id"])
                        product_cache_by_name[norm_name] = product_id
                    else:
                        # Si es nuevo, el precio_base es requerido
                        if base_price is None or base_price <= Decimal("0.00"):
                            errors.append(
                                f"Fila {row_idx} ({name}): Precio base inválido o ausente. El producto no pudo crearse."
                            )
                            continue

                        # Resolver taxonomías
                        brand_id = self._resolve_brand_id(str(row.get("marca") or ""), taxonomies)
                        subcat_id = self._resolve_subcategory_id(
                            str(row.get("categoria") or ""),
                            str(row.get("subcategoria") or ""),
                            taxonomies,
                        )
                        unique_slug = await self.catalog_service._resolve_unique_slug(name)

                        product_record = {
                            "name": name,
                            "slug": unique_slug,
                            "description": str(row.get("descripcion") or "").strip() or None,
                            "subcategory_id": subcat_id,
                            "brand_id": brand_id,
                            "base_price": float(base_price),
                            "sale_price": float(sale_price) if sale_price is not None else None,
                            "is_on_sale": is_on_sale,
                            "is_featured": is_featured,
                            "is_active": is_active,
                            "image_urls": images,
                        }

                        res = self.db.table("products").insert(product_record).execute()
                        created_p = _as_first_dict(res.data) if res else {}
                        if not created_p or not created_p.get("id"):
                            errors.append(f"Fila {row_idx} ({name}): Error al insertar en la base de datos.")
                            continue

                        product_id = str(created_p["id"])
                        product_cache_by_name[norm_name] = product_id
                        products_created += 1

                except Exception as exc:
                    logger.error(f"Error creando producto fila {row_idx}: {exc}")
                    errors.append(f"Fila {row_idx} ({name}): Error creando producto: {str(exc)}")
                    continue

            # Crear variante asociada
            try:
                sku_raw = str(row.get("sku_variante") or "").strip()
                variant_name_raw = str(row.get("nombre_variante") or "").strip() or "Estándar"
                variant_price = _to_decimal(row.get("precio_variante"))
                stock = _to_int(row.get("stock_variante"), default=10)

                # Generar SKU automático si no fue especificado
                if not sku_raw:
                    sku_clean = slugify(f"{name}-{variant_name_raw}").upper()
                    sku_raw = sku_clean[:40] or f"SKU-{UUID(int=row_idx).hex[:8].upper()}"

                # Chequear si la variante ya existe para este producto o en general
                var_check = (
                    self.db.table("product_variants")
                    .select("id, stock")
                    .eq("sku", sku_raw)
                    .limit(1)
                    .execute()
                )
                existing_variant = _as_first_dict(var_check.data) if var_check else None

                if existing_variant and existing_variant.get("id"):
                    # Si ya existe con ese SKU, actualizamos el stock sumando o seteando
                    var_id = existing_variant["id"]
                    self.db.table("product_variants").update({
                        "stock": stock,
                        "variant_name": variant_name_raw,
                    }).eq("id", var_id).execute()
                    warnings.append(
                        f"Fila {row_idx}: SKU '{sku_raw}' ya existía. Se actualizó su stock a {stock} unidades."
                    )
                else:
                    variant_record = {
                        "product_id": product_id,
                        "sku": sku_raw,
                        "variant_name": variant_name_raw,
                        "price_override": float(variant_price) if variant_price is not None else None,
                        "stock": max(0, stock),
                        "is_active": True,
                    }
                    self.db.table("product_variants").insert(variant_record).execute()
                    variants_created += 1

            except Exception as exc:
                logger.error(f"Error procesando variante fila {row_idx}: {exc}")
                warnings.append(f"Fila {row_idx} (Variante {sku_raw}): No se pudo crear variante: {str(exc)}")

        # Limpiar caché global de productos para que los clientes vean de inmediato los cambios
        global_cache.clear()

        return AdminImportSummary(
            success=products_created > 0 or variants_created > 0,
            products_created=products_created,
            variants_created=variants_created,
            total_rows_processed=total_rows_processed,
            warnings=warnings,
            errors=errors,
        )
