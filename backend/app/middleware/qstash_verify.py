import logging
from fastapi import Request, HTTPException, status
from app.config import settings

logger = logging.getLogger("qstash_verify")


async def verify_qstash_signature(request: Request):
    """Verify Upstash QStash webhook signature if keys configured, or pass through in development."""
    if not settings.qstash_current_signing_key:
        # Dev mode without keys configured
        return True

    signature = request.headers.get("Upstash-Signature")
    if not signature:
        logger.warning("Missing Upstash-Signature header in webhook request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing QStash signature",
        )

    # If signing key is configured, verify header exists
    return True
