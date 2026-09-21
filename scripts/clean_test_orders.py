#!/usr/bin/env python3
"""
Script para limpiar todos los pedidos, items y pagos de prueba en Supabase.
Proyecto: Natbell E-commerce

Uso:
  python scripts/clean_test_orders.py [--restore-stock] [--yes]
"""

import argparse
import contextlib
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Rutas base
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

if sys.platform == "win32":
    with contextlib.suppress(Exception):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

load_dotenv(BACKEND_DIR / ".env")

from app.database import get_supabase_client


def main():
    parser = argparse.ArgumentParser(description="Eliminar pedidos y registros de prueba de la base de datos.")
    parser.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help="Confirmar eliminación sin solicitar confirmación interactiva",
    )
    parser.add_argument(
        "--restore-stock",
        action="store_true",
        help="Restaurar el stock de productos en caso de pedidos marcados como pagados",
    )

    args = parser.parse_args()
    client = get_supabase_client()

    print("\n" + "=" * 70)
    print("🧹 LIMPIEZA DE PEDIDOS DE PRUEBA — NATBELL")
    print("=" * 70 + "\n")

    # 1. Consultar registros actuales
    orders_res = client.table("orders").select("id, order_number, status, total").execute()
    orders = orders_res.data or []

    items_res = client.table("order_items").select("id").execute()
    items = items_res.data or []

    payments_res = client.table("payments").select("id").execute()
    payments = payments_res.data or []

    print(f"📊 Registros encontrados actualmente en Supabase:")
    print(f"   • Pedidos (orders):      {len(orders)}")
    print(f"   • Líneas de pedido:      {len(items)}")
    print(f"   • Transacciones de pago: {len(payments)}")

    if not orders:
        print("\n✨ No hay ningún pedido en la base de datos. Está completamente limpia.")
        return

    print("\nListado de órdenes a eliminar:")
    for o in orders:
        print(f"   - {o['order_number']} | Estado: {o['status']} | Total: ${o['total']}")

    if not args.yes:
        confirm = input("\n⚠️  ¿Confirmás eliminar TODOS estos pedidos de prueba? (s/N): ").strip().lower()
        if confirm not in ("s", "si", "y", "yes"):
            print("❌ Operación cancelada. No se modificó nada.")
            return

    # 2. Restaurar stock opcional
    if args.restore_stock:
        paid_orders = [o for o in orders if o.get("status") == "paid"]
        for p_order in paid_orders:
            p_items = client.table("order_items").select("product_variant_id, quantity").eq("order_id", p_order["id"]).execute()
            for it in (p_items.data or []):
                var_id = it.get("product_variant_id")
                qty = it.get("quantity") or 0
                if var_id and qty > 0:
                    var_data = client.table("product_variants").select("stock").eq("id", var_id).execute()
                    if var_data.data:
                        curr = int(var_data.data[0].get("stock") or 0)
                        client.table("product_variants").update({"stock": curr + qty}).eq("id", var_id).execute()
                        print(f"   📦 Stock restaurado (+{qty}) para variante {var_id}")

    # 3. Eliminar órdenes (ON DELETE CASCADE elimina automáticamente order_items y payments)
    order_ids = [o["id"] for o in orders]
    delete_res = client.table("orders").delete().in_("id", order_ids).execute()

    print(f"\n✅ ¡Se eliminaron exitosamente {len(delete_res.data or order_ids)} pedidos!")
    print("✨ Las tablas 'orders', 'order_items' y 'payments' quedaron limpias.")
    print("🔄 El siguiente pedido que se cree volverá a arrancar desde ORD-2026-00001.\n")


if __name__ == "__main__":
    main()
