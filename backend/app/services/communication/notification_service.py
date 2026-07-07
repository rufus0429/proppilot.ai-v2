import json
import logging
from dataclasses import dataclass
from typing import Optional
from datetime import datetime, timezone

from app.services.communication.whatsapp import send_whatsapp_message
from app.services.communication.email import send_email_message
from app.db.repositories.leads import LeadRepository
from app.models import FollowUpChannel, FollowUpStatus

logger = logging.getLogger(__name__)


@dataclass
class MessageResult:
    success: bool
    channel: str
    external_id: Optional[str] = None
    provider_response: Optional[dict] = None
    error_message: Optional[str] = None
    mock: bool = False


async def send_message(
    lead_id: str,
    to: str,
    channel: str,
    message: str,
    subject: str = "",
) -> MessageResult:
    logger.info(f"=== Sending {channel.upper()} message to {to} (lead: {lead_id[:8]}...) ===")

    result = MessageResult(
        success=False,
        channel=channel,
    )

    try:
        if channel == "whatsapp":
            provider_result = await send_whatsapp_message(to, message)
            result.success = provider_result.get("success", False)
            result.external_id = provider_result.get("external_id")
            result.provider_response = provider_result.get("provider_response")
            result.mock = provider_result.get("mock", False)

            if result.success:
                logger.info(f"WhatsApp message delivered to {to}. ID: {result.external_id}")

        elif channel == "email":
            provider_result = await send_email_message(to, subject, message)
            result.success = provider_result.get("success", False)
            result.external_id = provider_result.get("external_id")
            result.provider_response = provider_result.get("provider_response")
            result.mock = provider_result.get("mock", False)

            if result.success:
                logger.info(f"Email delivered to {to}. ID: {result.external_id}")

        elif channel == "sms":
            logger.warning(f"SMS channel not yet implemented. Logging message for {to}.")
            result.success = True
            result.mock = True
            result.external_id = f"mock_sms_{to[-6:]}"

        elif channel == "call":
            logger.warning(f"Call channel not yet implemented. Logging task for {to}.")
            result.success = True
            result.mock = True
            result.external_id = f"mock_call_{to[-6:]}"

        elif channel == "internal_task":
            logger.info(f"Internal task generated for lead {lead_id[:8]}: {message[:100]}...")
            result.success = True
            result.mock = True

        else:
            logger.error(f"Unknown channel: {channel}")
            result.error_message = f"Unknown channel: {channel}"
            return result

    except Exception as e:
        logger.error(f"Failed to send {channel} message to {to}: {str(e)}")
        result.error_message = str(e)

    return result


async def save_message_log(
    lead_id: str,
    channel: str,
    message: str,
    result: MessageResult,
) -> None:
    try:
        from app.core.database.session import async_session_maker
        from app.models import Message, FollowUpChannel, FollowUpStatus
        from sqlalchemy import select

        status_map = {
            True: FollowUpStatus.SENT,
            False: FollowUpStatus.FAILED,
        }
        msg_status = status_map.get(result.success, FollowUpStatus.PENDING)

        async with async_session_maker() as session:
            msg = Message(
                lead_id=lead_id,
                channel=FollowUpChannel(result.channel) if result.channel in [c.value for c in FollowUpChannel] else FollowUpChannel.WHATSAPP,
                direction="outbound",
                content=message,
                status=msg_status,
                external_id=result.external_id,
                sent_at=datetime.now(timezone.utc) if result.success else None,
                error_message=result.error_message,
                meta_data={
                    "mock": result.mock,
                    "provider_response": result.provider_response,
                },
            )
            session.add(msg)
            await session.commit()
            logger.info(f"Message log saved for lead {lead_id[:8]}. ID: {msg.id[:8]}...")

    except Exception as e:
        logger.error(f"Failed to save message log for lead {lead_id[:8]}: {str(e)}")
