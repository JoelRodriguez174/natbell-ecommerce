#!/usr/bin/env python3
"""
Script de Certificación de Code Review para Natbell E-Commerce.
Valida linters, suite de tests y sella la aprobación del agente en .git/agent_code_review_approved.
"""

import os
import subprocess
import sys
from pathlib import Path

# Compatibilidad con consolas de Windows para UTF-8 y emojis
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def run_cmd(cmd: str, cwd: Path) -> bool:
    print(f"👉 Ejecutando: {cmd} (en {cwd.name})")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    return res.returncode == 0


def main():
    root_dir = Path(__file__).resolve().parent.parent
    backend_dir = root_dir / "backend"
    frontend_dir = root_dir / "frontend"
    git_dir = root_dir / ".git"

    print("\n" + "=" * 70)
    print("🤖 [NATBELL] Certificación de Code Review & Linter por Agente")
    print("=" * 70)

    # 1. Obtener commit SHA actual
    res = subprocess.run("git rev-parse HEAD", shell=True, cwd=root_dir, capture_output=True, text=True)
    if res.returncode != 0:
        print("❌ Error al obtener el commit actual de git.")
        sys.exit(1)

    current_sha = res.stdout.strip()
    print(f"📌 Commit a certificar: {current_sha}\n")

    # 2. Linter Backend (ruff)
    print("🔍 [1/4] Verificando Linter de Backend (ruff)...")
    if not run_cmd("ruff check app tests", cwd=backend_dir):
        print("❌ Falló el linter de Backend (ruff).")
        sys.exit(1)

    # 3. Tests Backend (pytest)
    print("\n🧪 [2/4] Ejecutando Tests de Backend (pytest)...")
    if not run_cmd("pytest -q", cwd=backend_dir):
        print("❌ Fallaron los tests de Backend (pytest).")
        sys.exit(1)

    # 4. Linter Frontend (eslint)
    print("\n🔍 [3/4] Verificando Linter de Frontend (eslint)...")
    if not run_cmd("npm run lint", cwd=frontend_dir):
        print("❌ Falló el linter de Frontend (eslint).")
        sys.exit(1)

    # 5. Tests Frontend (vitest)
    print("\n🧪 [4/4] Ejecutando Tests de Frontend (vitest)...")
    if not run_cmd("npm test", cwd=frontend_dir):
        print("❌ Fallaron los tests de Frontend (vitest).")
        sys.exit(1)

    # 6. Sellar aprobación
    approval_file = git_dir / "agent_code_review_approved"
    approval_file.write_text(current_sha, encoding="utf-8")

    print("\n" + "=" * 70)
    print("✅ CODE REVIEW & LINTER APROBADOS POR EL AGENTE")
    print(f"   Commit certificado: {current_sha}")
    print(f"   Aprobación registrada en: {approval_file}")
    print("   El repositorio está listo para pushear (git push autorizado).")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
