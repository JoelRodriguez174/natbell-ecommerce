import functools
import inspect
import json
import time
from dataclasses import dataclass
from typing import Any, Callable, Dict, Optional, Tuple


@dataclass
class _CacheEntry:
    value: Any
    expires_at: float


class CacheMemory:
    """
    Almacén de caché en memoria con soporte de TTL (Time-To-Live).
    Utiliza time.monotonic() para evitar discrepancias por cambios en el reloj del sistema.
    """

    def __init__(self) -> None:
        self._store: Dict[str, _CacheEntry] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            return None

        if time.monotonic() >= entry.expires_at:
            # Entrada expirada: limpieza perezosa (lazy eviction)
            self._store.pop(key, None)
            return None

        return entry.value

    def set(self, key: str, value: Any, ttl_seconds: int = 60) -> None:
        if ttl_seconds <= 0:
            self._store.pop(key, None)
            return

        expires_at = time.monotonic() + ttl_seconds
        self._store[key] = _CacheEntry(value=value, expires_at=expires_at)

    def delete(self, key: str) -> bool:
        return self._store.pop(key, None) is not None

    def invalidate_prefix(self, prefix: str) -> int:
        keys_to_remove = [k for k in self._store if k.startswith(prefix)]
        for k in keys_to_remove:
            self._store.pop(k, None)
        return len(keys_to_remove)

    def clear(self) -> None:
        self._store.clear()


# Instancia global por defecto para la aplicación
global_cache = CacheMemory()


def _serialize_arg(val: Any) -> str:
    """Serializa de forma determinista un argumento para la clave de caché."""
    if hasattr(val, "model_dump"):
        # Modelo Pydantic v2
        return json.dumps(val.model_dump(), sort_keys=True, default=str)
    if hasattr(val, "dict"):
        # Modelo Pydantic v1
        return json.dumps(val.dict(), sort_keys=True, default=str)
    if isinstance(val, (dict, list)):
        return json.dumps(val, sort_keys=True, default=str)
    return str(val)


def cached(
    ttl_seconds: int = 60,
    prefix: str = "",
    ignore_args: Tuple[str, ...] = ("cls", "self", "client", "response"),
    cache_instance: Optional[CacheMemory] = None,
):
    """
    Decorador para cachear resultados de funciones síncronas o asíncronas en memoria.

    :param ttl_seconds: Segundos de vida de la entrada de caché.
    :param prefix: Prefijo para la clave de caché (por defecto el nombre de la función).
    :param ignore_args: Nombres de argumentos a omitir en la clave (ej: 'client', 'response').
    :param cache_instance: Instancia de CacheMemory (usa global_cache si no se especifica).
    """
    cache = cache_instance or global_cache

    def decorator(func: Callable):
        sig = inspect.signature(func)
        key_prefix = prefix or func.__name__

        def _make_key(args, kwargs) -> str:
            bound = sig.bind_partial(*args, **kwargs)
            bound.apply_defaults()
            parts = []
            for name, val in sorted(bound.arguments.items()):
                if name in ignore_args:
                    continue
                parts.append(f"{name}={_serialize_arg(val)}")
            return f"{key_prefix}:{':'.join(parts)}"

        if inspect.iscoroutinefunction(func):

            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                cache_key = _make_key(args, kwargs)
                cached_val = cache.get(cache_key)
                if cached_val is not None:
                    return cached_val

                result = await func(*args, **kwargs)
                cache.set(cache_key, result, ttl_seconds=ttl_seconds)
                return result

            return async_wrapper
        else:

            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                cache_key = _make_key(args, kwargs)
                cached_val = cache.get(cache_key)
                if cached_val is not None:
                    return cached_val

                result = func(*args, **kwargs)
                cache.set(cache_key, result, ttl_seconds=ttl_seconds)
                return result

            return sync_wrapper

    return decorator
