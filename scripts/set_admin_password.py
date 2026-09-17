#!/usr/bin/env python3
"""
Script interactivo para generar o actualizar la contraseña de administrador.
Proyecto: Natbell E-commerce (Los Arrayanes)

Uso:
  python scripts/set_admin_password.py [--email admin@losarrayanes.com] [--password NUEVA_PASSWORD] [--update-db]
"""

import argparse
import contextlib
import os
import secrets
import string
import sys
from pathlib import Path

from dotenv import load_dotenv

# Rutas base
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Asegurar codificación utf-8 en terminales de Windows
if sys.platform == "win32":
    with contextlib.suppress(Exception):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

load_dotenv(BACKEND_DIR / ".env")

from app.utils.security import hash_password, verify_password


def generate_strong_password(length: int = 16) -> str:
    """Genera una contraseña robusta con mayúsculas, minúsculas, dígitos y símbolos."""
    chars = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    while True:
        pwd = "".join(secrets.choice(chars) for _ in range(length))
        # Asegurar al menos una mayúscula, una minúscula, un número y un símbolo
        if (
            any(c.isupper() for c in pwd)
            and any(c.islower() for c in pwd)
            and any(c.isdigit() for c in pwd)
            and any(c in "!@#$%^&*()-_=+" for c in pwd)
        ):
            return pwd


def main():
    parser = argparse.ArgumentParser(description="Actualizar contraseña de admin con bcrypt.")
    parser.add_argument(
        "--email",
        type=str,
        default="admin@losarrayanes.com",
        help="Email del administrador (por defecto: admin@losarrayanes.com)",
    )
    parser.add_argument(
        "--password",
        type=str,
        default=None,
        help="Nueva contraseña en texto plano (si se omite, se genera una segura)",
    )
    parser.add_argument(
        "--update-db",
        action="store_true",
        help="Actualizar directamente en la base de datos Supabase usando SUPABASE_SERVICE_KEY",
    )

    args = parser.parse_args()

    print("\n" + "=" * 75)
    print("🔐 GESTIÓN DE CONTRASEÑA DE ADMINISTRADOR — NATBELL")
    print("=" * 75 + "\n")

    email = args.email.strip().lower()
    plain_password = args.password

    if not plain_password:
        plain_password = generate_strong_password(18)
        print("✨ Se generó una contraseña segura recomendada:")
        print(f"   👉 Contraseña:  {plain_password}")
    else:
        print("🔑 Contraseña ingresada recibida.")

    # Generar hash seguro con bcrypt
    hashed = hash_password(plain_password)
    assert verify_password(plain_password, hashed)

    print(f"👤 Email admin:   {email}")
    print(f"🛡️  Hash bcrypt:   {hashed}")
    print("-" * 75)

    if args.update_db:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

        if not supabase_url or not supabase_key:
            print("⚠️  No se encontraron credenciales de Supabase en backend/.env.")
            print("   Se mostrará la consulta SQL para actualizar manualmente.")
        else:
            try:
                from supabase import create_client

                client = create_client(supabase_url, supabase_key)
                res = (
                    client.table("admin_users")
                    .update({"password_hash": hashed})
                    .eq("email", email)
                    .execute()
                )

                if res.data:
                    print(f"✅ ¡Contraseña actualizada exitosamente en Supabase para {email}!")
                else:
                    # Si no existe, intentar insertarlo
                    insert_res = (
                        client.table("admin_users")
                        .insert({"email": email, "password_hash": hashed, "name": "Admin Principal"})
                        .execute()
                    )
                    if insert_res.data:
                        print("✅ ¡Usuario administrador creado exitosamente en Supabase!")
                    else:
                        print("⚠️  No se pudo actualizar el registro en Supabase.")
            except Exception as exc:  # noqa: BLE001
                print(f"❌ Error al conectar con Supabase: {exc}")

    print("\n📄 Consulta SQL para actualizar directamente en el SQL Editor de Supabase:")
    print("-" * 75)
    print("UPDATE admin_users")
    print(f"SET password_hash = '{hashed}'")
    print(f"WHERE email = '{email}';")
    print("-" * 75)
    print("\n💡 Recordá guardar la contraseña en un gestor de contraseñas seguro.\n")


if __name__ == "__main__":
    main()
