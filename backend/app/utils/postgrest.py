from datetime import datetime
from typing import Any, Dict, List


def as_dict_list(data: Any) -> List[Dict[str, Any]]:
    """Convierte de forma segura datos de PostgREST en una lista de diccionarios tipados."""
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict):
        return [data]
    return []


def as_first_dict(data: Any) -> Dict[str, Any]:
    """Obtiene de forma segura el primer diccionario de un payload relacional de PostgREST."""
    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, dict):
            return first
    elif isinstance(data, dict):
        return data
    return {}


def parse_datetime(val: Any) -> datetime:
    """Parsea de forma robusta strings de fecha ISO provenientes de Supabase/PostgreSQL."""
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except Exception:
            pass
    return datetime.now()
