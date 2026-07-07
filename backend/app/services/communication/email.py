import json
import logging
from typing import Optional
from app.core.config.settings import settings

logger = logging.getLogger(__name__)


def _is_configured() -> bool:
    return bool(settings.sendgrid_api_key)


class MockEmailProvider:
    @staticmethod
    async def send(to: str, subject: str, body: str) -> dict:
        logger.warning("=== MOCK EMAIL: No email credentials configured ===")
        logger.warning(f"=== MOCK EMAIL: Would send to {to} ===")
        logger.warning(f"=== MOCK EMAIL: Subject: {subject} ===")
        logger.warning(f"=== MOCK EMAIL: Body ===")
        for line in body.split("\n"):
            logger.warning(f"  {line}")
        logger.warning("=== MOCK EMAIL: End of message ===")
        return {
            "success": True,
            "mock": True,
            "external_id": f"mock_email_{to[:8]}",
            "message": "Email logged to console (mock mode)",
        }


class ResendEmailProvider:
    def __init__(self):
        self.api_key = settings.sendgrid_api_key
        self.from_email = settings.sendgrid_from_email or "noreply@proppilot.ai"
        self.api_url = "https://api.resend.com/emails"

    async def send(self, to: str, subject: str, body: str) -> dict:
        if not subject:
            lines = body.split("\n")
            for line in lines:
                if line.startswith("Subject:"):
                    subject = line.replace("Subject:", "").strip()
                    body_parts = lines[lines.index(line) + 1:]
                    body = "\n".join(body_parts).strip()
                    break
            if not subject:
                subject = "PropPilot AI - Update"

        payload = {
            "from": self.from_email,
            "to": [to],
            "subject": subject,
            "text": body,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        logger.info(f"Calling Resend API: POST {self.api_url}")

        try:
            import httpx
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers=headers,
                )
                response_data = response.json()
                logger.info(f"Resend API response: {json.dumps(response_data, indent=2)}")

                if response.status_code == 200:
                    external_id = response_data.get("id", "")
                    logger.info(f"Email sent successfully. ID: {external_id}")
                    return {
                        "success": True,
                        "external_id": external_id,
                        "status_code": response.status_code,
                        "provider_response": response_data,
                    }
                else:
                    error_msg = response_data.get("message", response.text)
                    logger.error(f"Resend API error: {response.status_code} - {error_msg}")
                    raise Exception(f"Resend API error {response.status_code}: {error_msg}")

        except ImportError:
            logger.warning("httpx not installed. Falling back to MockEmailProvider.")
            result = await MockEmailProvider.send(to, subject, body)
            return result
        except httpx.RequestError as e:
            logger.error(f"Resend API request failed: {str(e)}")
            raise Exception(f"Failed to send email: {str(e)}")


async def send_email_message(to: str, subject: str, body: str) -> dict:
    if not _is_configured():
        logger.warning("Email credentials not configured. Using MockEmailProvider.")
        result = await MockEmailProvider.send(to, subject, body)
        return result

    provider = ResendEmailProvider()
    result = await provider.send(to, subject, body)
    return result
