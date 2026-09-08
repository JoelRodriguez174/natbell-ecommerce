from abc import ABC, abstractmethod
from decimal import Decimal
import re
from typing import Optional, List, Dict, Any
from app.database import supabase
from app.models.shipping import ShippingQuoteResponse


class ShippingProvider(ABC):
    @abstractmethod
    def calculate_cost(self, postal_code: str) -> ShippingQuoteResponse:
        """Calculate shipping cost and estimated days for given postal code."""
        pass


class FixedRateProvider(ShippingProvider):
    # Built-in fallback zones if DB is empty or during bootstrapping
    FALLBACK_ZONES = [
        {
            "zone_name": "CABA",
            "postal_code_ranges": [{"from": "1000", "to": "1499"}],
            "cost": Decimal("3500.00"),
            "estimated_days": 2,
        },
        {
            "zone_name": "GBA",
            "postal_code_ranges": [
                {"from": "1500", "to": "1999"},
                {"from": "1600", "to": "1699"},
            ],
            "cost": Decimal("5000.00"),
            "estimated_days": 3,
        },
        {
            "zone_name": "Interior del País",
            "postal_code_ranges": [{"from": "2000", "to": "9999"}],
            "cost": Decimal("7500.00"),
            "estimated_days": 5,
        },
    ]

    def _extract_numeric_cp(self, postal_code: str) -> Optional[int]:
        """Extract numeric postal code (e.g. C1425DKB -> 1425, 1425 -> 1425)."""
        clean = postal_code.strip()
        match = re.search(r"\d{4}", clean)
        if match:
            return int(match.group(0))
        # If fewer digits or different format
        digits = "".join(filter(str.isdigit, clean))
        if digits:
            return int(digits[:4])
        return None

    def calculate_cost(self, postal_code: str) -> ShippingQuoteResponse:
        numeric_cp = self._extract_numeric_cp(postal_code)

        # Try to load zones from Supabase
        zones: List[Dict[str, Any]] = []
        try:
            res = (
                supabase.table("shipping_zones")
                .select("*")
                .eq("is_active", True)
                .execute()
            )
            if res.data:
                zones = res.data
        except Exception:
            # Fallback to local configuration if DB offline
            zones = self.FALLBACK_ZONES

        if not zones:
            zones = self.FALLBACK_ZONES

        # Find matching zone
        if numeric_cp is not None:
            for zone in zones:
                ranges = zone.get("postal_code_ranges") or []
                for r in ranges:
                    try:
                        from_cp = int(r.get("from", 0))
                        to_cp = int(r.get("to", 9999))
                        if from_cp <= numeric_cp <= to_cp:
                            return ShippingQuoteResponse(
                                zone_name=zone["zone_name"],
                                cost=Decimal(str(zone["cost"])),
                                estimated_days=int(zone["estimated_days"]),
                                postal_code=postal_code,
                            )
                    except (ValueError, TypeError):
                        continue

        # Default to interior if not matched
        interior_zone = next(
            (z for z in zones if "interior" in z.get("zone_name", "").lower()),
            zones[-1],
        )
        return ShippingQuoteResponse(
            zone_name=interior_zone["zone_name"],
            cost=Decimal(str(interior_zone["cost"])),
            estimated_days=int(interior_zone["estimated_days"]),
            postal_code=postal_code,
        )


shipping_provider: ShippingProvider = FixedRateProvider()
