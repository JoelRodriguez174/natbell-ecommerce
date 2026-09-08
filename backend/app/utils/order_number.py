from datetime import datetime
import secrets


def generate_order_number() -> str:
    """Generate human-readable unique order identifier in format ORD-YYYY-NNNNN."""
    year = datetime.utcnow().year
    random_num = secrets.randbelow(90000) + 10000  # 5-digit number: 10000 to 99999
    return f"ORD-{year}-{random_num}"
