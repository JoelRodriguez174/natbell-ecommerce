import re
import unicodedata


def slugify(text: str) -> str:
    """Convierte un texto arbitrario en un slug URL normalizado y seguro."""
    if not text:
        return ""
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    cleaned = re.sub(r"[^\w\s-]", "", normalized).strip().lower()
    return re.sub(r"[-\s]+", "-", cleaned)
