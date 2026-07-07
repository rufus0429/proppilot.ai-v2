import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional
from app.db.repositories.leads import LeadRepository
from app.services.communication.notification_service import send_message, save_message_log, MessageResult
from app.services.agents.lead_nurturing import build_followup_response
from app.core.database.session import async_session_maker
from app.models import Activity, ActivityType, FollowUpStatus

logger = logging.getLogger(__name__)
repo = LeadRepository()

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


async def execute_followup(lead_id: str) -> None:
    lead = await repo.get_by_id(lead_id)
    if not lead:
        logger.error(f"Follow-up: Lead {lead_id[:8]} not found. Aborting.")
        return

    name = lead.name or "Customer"
    phone = lead.phone or ""
    email = lead.email or ""
    location = lead.location or ""
    property_type = lead.property_type.value if lead.property_type else None
    intent = lead.intent or ""
    score = lead.lead_score or 0
    priority = lead.priority.value if lead.priority else "cold"

    logger.info(f"=== Follow-up Agent: Starting for lead {lead_id[:8]} ({name}) ===")

    await _log_activity(lead_id, ActivityType.WORKFLOW_STARTED, "AI Follow-up Started", "Beginning automated follow-up sequence")

    followup = build_followup_response(
        name=name,
        phone=phone,
        location=location,
        property_type=property_type,
        score=score,
        priority=priority,
        intent=intent,
    )

    whatsapp_already_sent = await _is_already_sent(lead_id, "whatsapp")
    email_already_sent = await _is_already_sent(lead_id, "email")

    if whatsapp_already_sent:
        logger.info(f"Follow-up: WhatsApp already sent to lead {lead_id[:8]}. Skipping.")
        await _update_lead_status(lead_id, "whatsapp_status", "skipped")

    if email_already_sent:
        logger.info(f"Follow-up: Email already sent to lead {lead_id[:8]}. Skipping.")
        await _update_lead_status(lead_id, "email_status", "skipped")

    if not whatsapp_already_sent and phone:
        await _send_with_retry(
            lead_id=lead_id,
            channel="whatsapp",
            to=phone,
            message=followup.get("message", ""),
            status_field="whatsapp_status",
            sent_at_field="whatsapp_sent_at",
            log_title="WhatsApp Sent",
        )

    if not email_sent and email:
        email_subject = "Your Property Recommendations from PropPilot AI"
        email_body = followup.get("message", "")
        await _send_with_retry(
            lead_id=lead_id,
            channel="email",
            to=email,
            message=email_body,
            subject=email_subject,
            status_field="email_status",
            sent_at_field="email_sent_at",
            log_title="Email Sent",
        )

    now = datetime.now(timezone.utc)
    await repo.update(lead_id, {
        "last_followup_at": now,
        "current_stage": "followup_active",
    })

    await _log_activity(lead_id, ActivityType.WORKFLOW_COMPLETED, "Waiting for Customer Reply", "Follow-up messages sent. Awaiting customer response.")

    logger.info(f"=== Follow-up Agent: Completed for lead {lead_id[:8]} ===")


async def _send_with_retry(
    lead_id: str,
    channel: str,
    to: str,
    message: str,
    status_field: str,
    sent_at_field: str,
    log_title: str,
    subject: str = "",
) -> bool:
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        logger.info(f"Follow-up: Sending {channel.upper()} to {to} (attempt {attempt}/{MAX_RETRIES})")
        try:
            result: MessageResult = await send_message(
                lead_id=lead_id,
                to=to,
                channel=channel,
                message=message,
                subject=subject,
            )

            await save_message_log(
                lead_id=lead_id,
                channel=channel,
                message=message,
                result=result,
            )

            if result.success:
                now = datetime.now(timezone.utc)
                await repo.update(lead_id, {
                    status_field: "sent",
                    sent_at_field: now,
                    "last_contacted_at": now,
                    "followup_retry_count": attempt - 1,
                })

                await _log_activity(
                    lead_id,
                    ActivityType.FOLLOWUP_SENT,
                    log_title,
                    f"Sent via {channel.upper()} to {to}",
                )

                logger.info(f"Follow-up: {channel.upper()} sent successfully to {to} on attempt {attempt}")
                return True

            last_error = result.error_message or "Unknown error"

        except Exception as e:
            last_error = str(e)
            logger.error(f"Follow-up: {channel.upper()} attempt {attempt} failed for {to}: {last_error}")

        if attempt < MAX_RETRIES:
            logger.info(f"Follow-up: Retrying {channel.upper()} in {RETRY_DELAY_SECONDS}s...")
            await asyncio.sleep(RETRY_DELAY_SECONDS)

    now = datetime.now(timezone.utc)
    await repo.update(lead_id, {
        status_field: "failed",
        sent_at_field: now,
        "followup_retry_count": MAX_RETRIES,
    })

    await _log_activity(
        lead_id,
        ActivityType.WORKFLOW_FAILED,
        f"{channel.upper()} Failed",
        f"Failed after {MAX_RETRIES} attempts. Last error: {last_error}",
    )

    logger.error(f"Follow-up: {channel.upper()} failed for {to} after {MAX_RETRIES} attempts. Last error: {last_error}")
    return False


async def _is_already_sent(lead_id: str, channel: str) -> bool:
    from sqlalchemy import select
    from app.core.database.session import async_session_maker
    from app.models import Message, FollowUpChannel

    channel_enum = FollowUpChannel.WHATSAPP if channel == "whatsapp" else FollowUpChannel.EMAIL

    async with async_session_maker() as session:
        stmt = (
            select(Message)
            .where(Message.lead_id == str(lead_id))
            .where(Message.channel == channel_enum)
            .where(Message.status.in_([FollowUpStatus.SENT, FollowUpStatus.DELIVERED]))
            .limit(1)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None


async def _update_lead_status(lead_id: str, field: str, value: str) -> None:
    await repo.update(lead_id, {field: value})


async def _log_activity(lead_id: str, activity_type: ActivityType, title: str, description: str = "") -> None:
    try:
        async with async_session_maker() as session:
            activity = Activity(
                lead_id=str(lead_id),
                activity_type=activity_type,
                title=title,
                description=description,
            )
            session.add(activity)
            await session.commit()
    except Exception as e:
        logger.error(f"Failed to log activity for lead {lead_id[:8]}: {e}")



