import re
from datetime import datetime
from typing import Optional

ORDER_NUMBER_REGEX = re.compile(r"^ORD-(\d{4})-(\d{5})$")


def generate_order_number(sequence: int, year: Optional[int] = None) -> str:
    """Genera un código de orden correlativo con formato ORD-YYYY-NNNNN.
    Ejemplo: ORD-2026-00001
    """
    if year is None:
        year = datetime.now().year
    return f"ORD-{year}-{sequence:05d}"


def parse_order_sequence(order_number: str) -> Optional[int]:
    """Extrae el número de secuencia de un order_number válido.
    Retorna el entero o None si el formato no coincide.
    """
    match = ORDER_NUMBER_REGEX.match(order_number)
    if not match:
        return None
    return int(match.group(2))
