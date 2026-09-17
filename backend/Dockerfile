# ==========================================================
# Etapa 1: Builder (Instalación de dependencias)
# ==========================================================
FROM python:3.13-slim AS builder

WORKDIR /build

# Herramientas de compilación si fueran requeridas por ruedas C
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ==========================================================
# Etapa 2: Runtime final ligero y seguro
# ==========================================================
FROM python:3.13-slim AS runtime

WORKDIR /app

# Crear usuario no privilegiado por seguridad
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copiar dependencias de Python desde la etapa builder
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copiar código fuente de la aplicación
COPY --chown=appuser:appuser . /app

# Cambiar a usuario no-root
USER appuser

# Exponer puerto (Render asigna la variable $PORT)
EXPOSE 8000

# Comando de ejecución con workers Uvicorn de producción
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
