import logging
from typing import Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger("qstash_service")


class QStashService:
    @staticmethod
    async def publish_message(
        destination_url: str,
        payload: Dict[str, Any],
        delay_seconds: int = 0,
    ) -> bool:
        """Publish an asynchronous message/event to Upstash QStash."""
        if not settings.qstash_token or settings.qstash_token == "placeholder_token":
            logger.info(
                f"[Dev/Placeholder] QStash message to {destination_url} bypassed: {payload}"
            )
            return True

        url = f"https://qstash.upstash.io/v2/publish/{destination_url}"
        headers = {
            "Authorization": f"Bearer {settings.qstash_token}",
            "Content-Type": "application/json",
        }
        if delay_seconds > 0:
            headers["Upstash-Delay"] = f"{delay_seconds}s"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.is_success:
                    logger.info(f"Published message to QStash targeting {destination_url}")
                    return True
                else:
                    logger.error(
                        f"Failed to publish to QStash: {res.status_code} - {res.text}"
                    )
                    return False
        except Exception as e:
            logger.error(f"Error publishing to QStash: {e}")
            return False
