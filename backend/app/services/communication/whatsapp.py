import json
import logging
import httpx
from typing import Optional
from app.core.config.settings import settings

logger = logging.getLogger(__name__)

WHATSAPP_API_BASE = "https://graph.facebook.com/v21.0"


def _is_configured() -> bool:
    return bool(settings.whatsapp_phone_number_id and settings.whatsapp_access_token)


class MockWhatsAppProvider:
    @staticmethod
    async def send(to: str, message: str) -> dict:
        logger.warning("=== MOCK WHATSAPP: No WhatsApp credentials configured ===")
        logger.warning(f"=== MOCK WHATSAPP: Would send to {to} ===")
        logger.warning(f"=== MOCK WHATSAPP: Message content ===")
        for line in message.split("\n"):
            logger.warning(f"  {line}")
        logger.warning("=== MOCK WHATSAPP: End of message ===")
        return {
            "success": True,
            "mock": True,
            "external_id": f"mock_whatsapp_{to[-6:]}",
            "message": "Message logged to console (mock mode)",
        }


class WhatsAppProvider:
    def __init__(self):
        self.phone_number_id = settings.whatsapp_phone_number_id
        self.access_token = settings.whatsapp_access_token
        self.api_url = f"{WHATSAPP_API_BASE}/{self.phone_number_id}/messages"

    async def send(self, to: str, message: str) -> dict:
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to.lstrip("+"),
            "type": "text",
            "text": {"preview_url": False, "body": message},
        }

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        logger.info(f"Calling WhatsApp API: POST {self.api_url}")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers=headers,
                )
                response_data = response.json()
                logger.info(f"WhatsApp API response: {json.dumps(response_data, indent=2)}")

                if response.status_code == 200 or response.status_code == 201:
                    external_id = response_data.get("messages", [{}])[0].get("id", "")
                    logger.info(f"WhatsApp message sent successfully. ID: {external_id}")
                    return {
                        "success": True,
                        "external_id": external_id,
                        "status_code": response.status_code,
                        "provider_response": response_data,
                    }
                else:
                    logger.error(f"WhatsApp API error: {response.status_code} - {response.text}")
                    raise Exception(f"WhatsApp API error {response.status_code}: {response_data.get('error', {}).get('message', response.text)}")

        except httpx.RequestError as e:
            logger.error(f"WhatsApp API request failed: {str(e)}")
            raise Exception(f"Failed to send WhatsApp message: {str(e)}")


async def send_whatsapp_message(to: str, message: str) -> dict:
    if not _is_configured():
        logger.warning("WhatsApp credentials not configured. Using MockWhatsAppProvider.")
        result = await MockWhatsAppProvider.send(to, message)
        return result

    provider = WhatsAppProvider()
    result = await provider.send(to, message)
    return result
