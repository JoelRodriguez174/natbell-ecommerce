import logging

import httpx

from app.config import settings

logger = logging.getLogger("natbell.email")


class EmailService:
    """Transactional email service using Resend API with local simulation fallback."""

    def __init__(self):
        self.api_key = settings.resend_api_key
        self.from_email = settings.email_from
        self.api_url = "https://api.resend.com/emails"

    async def send_verification_email(self, to_email: str, name: str, code: str) -> bool:
        """Sends a 6-digit email verification code for new admin registration."""
        subject = f"Natbell Admin — Código de Verificación: {code}"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }}
            .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background: #0f172a; padding: 28px; text-align: center; color: #f59e0b; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }}
            .header p {{ margin: 4px 0 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }}
            .content {{ padding: 32px 28px; }}
            .greeting {{ font-size: 16px; font-weight: 600; margin-bottom: 12px; }}
            .text {{ font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }}
            .otp-box {{ background: #fef3c7; border: 2px dashed #f59e0b; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px; }}
            .otp-code {{ font-size: 34px; font-weight: 800; letter-spacing: 0.25em; color: #b45309; font-family: monospace; }}
            .warning {{ font-size: 12px; color: #64748b; background: #f1f5f9; padding: 12px; border-radius: 6px; }}
            .footer {{ background: #f8fafc; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Natbell Cosmética Profesional</h1>
              <p>Panel de Administración — Los Arrayanes</p>
            </div>
            <div class="content">
              <div class="greeting">¡Hola, {name}!</div>
              <p class="text">
                Has iniciado el proceso de registro como administrador en el portal de Natbell.
                Para verificar tu dirección de correo y activar tu cuenta, ingresá el siguiente código de 6 dígitos:
              </p>
              <div class="otp-box">
                <span class="otp-code">{code}</span>
              </div>
              <p class="warning">
                ⏳ Este código expira en <strong>15 minutos</strong>. Si vos no solicitaste esta cuenta, podés ignorar este correo de forma segura.
              </p>
            </div>
            <div class="footer">
              &copy; 2026 Natbell / Los Arrayanes. Todos los derechos reservados.
            </div>
          </div>
        </body>
        </html>
        """
        return await self._dispatch_email(to_email, subject, html, code, "verificación de cuenta")

    async def send_password_reset_email(self, to_email: str, name: str, code: str) -> bool:
        """Sends a 6-digit password reset code."""
        subject = f"Natbell Admin — Código de Recuperación: {code}"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }}
            .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background: #0f172a; padding: 28px; text-align: center; color: #f59e0b; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }}
            .header p {{ margin: 4px 0 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }}
            .content {{ padding: 32px 28px; }}
            .greeting {{ font-size: 16px; font-weight: 600; margin-bottom: 12px; }}
            .text {{ font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }}
            .otp-box {{ background: #fee2e2; border: 2px dashed #ef4444; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px; }}
            .otp-code {{ font-size: 34px; font-weight: 800; letter-spacing: 0.25em; color: #b91c1c; font-family: monospace; }}
            .warning {{ font-size: 12px; color: #64748b; background: #f1f5f9; padding: 12px; border-radius: 6px; }}
            .footer {{ background: #f8fafc; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Natbell Cosmética Profesional</h1>
              <p>Panel de Administración — Los Arrayanes</p>
            </div>
            <div class="content">
              <div class="greeting">Hola, {name}</div>
              <p class="text">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta de administrador en Natbell.
                Ingresá el siguiente código de recuperación para continuar:
              </p>
              <div class="otp-box">
                <span class="otp-code">{code}</span>
              </div>
              <p class="warning">
                ⏳ Este código expira en <strong>15 minutos</strong>. Si no solicitaste este cambio, te recomendamos revisar la seguridad de tu correo inmediatamente.
              </p>
            </div>
            <div class="footer">
              &copy; 2026 Natbell / Los Arrayanes. Todos los derechos reservados.
            </div>
          </div>
        </body>
        </html>
        """
        return await self._dispatch_email(to_email, subject, html, code, "recuperación de contraseña")

    async def send_shipping_notification_email(
        self,
        to_email: str,
        customer_name: str,
        order_number: str,
        tracking_number: str,
        tracking_url: str,
    ) -> bool:
        """Sends a notification email to the customer with their Andreani tracking code and link."""
        subject = f"¡Tu pedido {order_number} está en camino! — Natbell"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }}
            .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background: #0f172a; padding: 28px; text-align: center; color: #f59e0b; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }}
            .header p {{ margin: 4px 0 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }}
            .content {{ padding: 32px 28px; }}
            .greeting {{ font-size: 16px; font-weight: 600; margin-bottom: 12px; }}
            .text {{ font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }}
            .tracking-box {{ background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px; }}
            .tracking-code {{ font-size: 24px; font-weight: 800; letter-spacing: 0.1em; color: #1d4ed8; font-family: monospace; }}
            .btn-track {{ display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 14px; }}
            .footer {{ background: #f8fafc; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Natbell Cosmética Profesional</h1>
              <p>Tu pedido está en camino</p>
            </div>
            <div class="content">
              <div class="greeting">¡Hola, {customer_name}!</div>
              <p class="text">
                Queremos contarte que tu pedido <strong>{order_number}</strong> ya fue despachado a través de <strong>Andreani</strong>.
              </p>
              <div class="tracking-box">
                <div style="font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; font-weight: 600;">Código de seguimiento Andreani</div>
                <div class="tracking-code">{tracking_number}</div>
                <div style="margin-top: 12px;">
                  <a href="{tracking_url}" class="btn-track" style="color: #ffffff;" target="_blank">Rastrear mi paquete</a>
                </div>
              </div>
              <p class="text" style="font-size: 13px; color: #64748b;">
                También podés consultar el estado de tu pedido directamente desde nuestra tienda online ingresando tu número de pedido.
              </p>
            </div>
            <div class="footer">
              &copy; 2026 Natbell Cosmética Profesional. Todos los derechos reservados.
            </div>
          </div>
        </body>
        </html>
        """
        return await self._dispatch_email(to_email, subject, html, None, "notificación de despacho y seguimiento")

    async def _dispatch_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        code: str | None,
        flow_desc: str,
    ) -> bool:
        """Dispatches email via Resend or logs simulated message in development mode."""
        api_key = settings.resend_api_key

        if not api_key:
            # Fallback Simulado para desarrollo local y tests sin API key externa
            print("\n=======================================================")
            print(f"[DEV SIMULATION EMAIL] Destinatario: {to_email}")
            print(f"[DEV SIMULATION EMAIL] Propósito: {flow_desc}")
            if code:
                print(f"[DEV SIMULATION EMAIL] CÓDIGO OTP: {code}")
            print("=======================================================\n")
            logger.info("Email simulado localmente para %s (Propósito: %s)", to_email, flow_desc)
            return True

        payload = {
            "from": settings.email_from,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(self.api_url, json=payload, headers=headers)
                if res.status_code in (200, 201):
                    logger.info("Email transaccional enviado con éxito a %s vía Resend", to_email)
                    return True
                logger.error(
                    "Error al enviar email con Resend (%d): %s",
                    res.status_code,
                    res.text,
                )
                return False
        except Exception as exc:
            logger.error("Excepción al conectar con Resend API: %s", exc)
            return False


_email_service_instance = None


def get_email_service() -> EmailService:
    global _email_service_instance
    if _email_service_instance is None:
        _email_service_instance = EmailService()
    return _email_service_instance
