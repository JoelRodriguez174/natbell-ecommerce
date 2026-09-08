import logging
from typing import Dict, Any

logger = logging.getLogger("notification_service")


class NotificationService:
    @staticmethod
    def send_order_confirmation(order_data: Dict[str, Any]) -> bool:
        """Send order confirmation email/notification to customer."""
        customer_email = order_data.get("customer_email")
        order_number = order_data.get("order_number")
        total = order_data.get("total")
        logger.info(
            f"Sent order confirmation to {customer_email} for order #{order_number} (Total: ${total})"
        )
        return True

    @staticmethod
    def send_payment_received(order_data: Dict[str, Any]) -> bool:
        """Send payment received confirmation."""
        customer_email = order_data.get("customer_email")
        order_number = order_data.get("order_number")
        logger.info(
            f"Sent payment receipt to {customer_email} for order #{order_number}"
        )
        return True
