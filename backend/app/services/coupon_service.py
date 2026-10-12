import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from fastapi import HTTPException
from supabase import Client

from app.database import get_supabase_client
from app.models.coupon import CouponCreate, CouponUpdate
from app.utils.postgrest import as_dict_list, as_first_dict

logger = logging.getLogger(__name__)


class CouponService:
    def __init__(self, db_client: Optional[Client] = None):
        self._db = db_client

    @property
    def db(self) -> Client:
        if self._db is None:
            self._db = get_supabase_client()
        return self._db

    def validate_coupon(self, code: str) -> Dict[str, Any]:
        """Valida que un cupón exista, esté activo, no haya expirado y no haya superado su cupo de usos."""
        normalized_code = (code or "").strip().upper()
        if not normalized_code:
            raise HTTPException(status_code=400, detail="El código de cupón no puede estar vacío.")

        res = self.db.table("coupons").select("*").eq("code", normalized_code).execute()
        rows = as_dict_list(res.data) if hasattr(res, "data") else []
        coupon = rows[0] if rows else as_first_dict(res.data) if res.data else None

        if not coupon:
            raise HTTPException(status_code=404, detail="El cupón ingresado no existe.")

        if not coupon.get("is_active"):
            raise HTTPException(status_code=400, detail="Este cupón se encuentra inactivo.")

        expires_at_str = coupon.get("expires_at")
        if expires_at_str:
            try:
                exp = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) > exp:
                    raise HTTPException(status_code=400, detail="Este cupón ha expirado.")
            except ValueError:
                pass

        max_uses = coupon.get("max_uses")
        times_used = coupon.get("times_used", 0) or 0
        if max_uses is not None and times_used >= max_uses:
            raise HTTPException(
                status_code=400, detail="Este cupón alcanzó su límite máximo de usos."
            )

        return coupon

    def increment_coupon_usage(self, coupon_id: Union[str, UUID]) -> None:
        """Incrementa el contador de usos del cupón."""
        str_id = str(coupon_id)
        res = self.db.table("coupons").select("times_used").eq("id", str_id).execute()
        rows = as_dict_list(res.data) if hasattr(res, "data") else []
        current_uses = rows[0].get("times_used", 0) if rows else 0
        self.db.table("coupons").update({"times_used": current_uses + 1}).eq("id", str_id).execute()

    def list_coupons(self) -> List[Dict[str, Any]]:
        """Lista todos los cupones ordenados por fecha de creación desc."""
        res = self.db.table("coupons").select("*").order("created_at", desc=True).execute()
        return as_dict_list(res.data) if hasattr(res, "data") else []

    def create_coupon(self, data: CouponCreate) -> Dict[str, Any]:
        """Crea un nuevo cupón validando que el código no esté duplicado."""
        existing = (
            self.db.table("coupons")
            .select("id")
            .eq("code", data.code)
            .execute()
        )
        existing_rows = as_dict_list(existing.data) if hasattr(existing, "data") else []
        if existing_rows:
            raise HTTPException(
                status_code=400, detail=f"Ya existe un cupón con el código '{data.code}'."
            )

        payload = {
            "code": data.code,
            "discount_percent": data.discount_percent,
            "is_active": data.is_active,
            "max_uses": data.max_uses,
            "expires_at": data.expires_at.isoformat() if data.expires_at else None,
        }
        res = self.db.table("coupons").insert(payload).execute()
        rows = as_dict_list(res.data) if hasattr(res, "data") else []
        if not rows:
            raise HTTPException(
                status_code=500, detail="Error al crear el cupón en la base de datos."
            )
        return rows[0]

    def update_coupon(self, coupon_id: Union[str, UUID], data: CouponUpdate) -> Dict[str, Any]:
        """Actualiza un cupón existente."""
        str_id = str(coupon_id)
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if data.expires_at is not None:
            update_data["expires_at"] = data.expires_at.isoformat()

        res = self.db.table("coupons").update(update_data).eq("id", str_id).execute()
        rows = as_dict_list(res.data) if hasattr(res, "data") else []
        if not rows:
            raise HTTPException(status_code=404, detail="Cupón no encontrado.")
        return rows[0]

    def toggle_status(self, coupon_id: Union[str, UUID], is_active: bool) -> Dict[str, Any]:
        """Alterna el estado activo/inactivo de un cupón."""
        str_id = str(coupon_id)
        res = self.db.table("coupons").update({"is_active": is_active}).eq("id", str_id).execute()
        rows = as_dict_list(res.data) if hasattr(res, "data") else []
        if not rows:
            raise HTTPException(status_code=404, detail="Cupón no encontrado.")
        return rows[0]

    def delete_coupon(self, coupon_id: Union[str, UUID]) -> bool:
        """Elimina un cupón."""
        str_id = str(coupon_id)
        res = self.db.table("coupons").delete().eq("id", str_id).execute()
        rows = as_dict_list(res.data) if hasattr(res, "data") else []
        if not rows:
            raise HTTPException(status_code=404, detail="Cupón no encontrado.")
        return True
