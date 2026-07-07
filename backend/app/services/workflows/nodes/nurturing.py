import logging
from datetime import datetime, timezone
from app.services.agents.lead_nurturing import build_followup_response
from app.services.workflows.state import LeadState
from app.db.repositories.leads import LeadRepository
from app.core.database.session import async_session_maker
from app.models import Activity, ActivityType

logger = logging.getLogger(__name__)


async def lead_nurturing_node(state: LeadState) -> LeadState:
    lead_id = str(state.get("lead_id", ""))
    name = state.get("name")
    phone = state.get("phone", "")
    location = state.get("location")
    property_type = state.get("property_type")
    bedrooms = state.get("bedrooms")
    budget_min = state.get("budget_min")
    budget_max = state.get("budget_max")
    score = state.get("lead_score", 0)
    priority = state.get("priority", "cold")
    intent = state.get("intent")

    try:
        logger.info(f"=== Workflow: Generating WhatsApp follow-up for lead {lead_id[:8]} ===")

        result = build_followup_response(
            name=name,
            phone=phone,
            location=location,
            property_type=property_type,
            bedrooms=bedrooms,
            budget_min=budget_min,
            budget_max=budget_max,
            score=score,
            priority=priority,
            intent=intent,
        )

        message = result["message"]
        whatsapp_url = result["whatsapp_url"]
        recipient_phone = result["phone"]

        state["whatsapp_message"] = message
        state["whatsapp_url"] = whatsapp_url
        state["whatsapp_phone"] = recipient_phone
        state["current_stage"] = "followup_active"
        state["status"] = "followup_ready"

        try:
            repo = LeadRepository()
            await repo.update(lead_id, {
                "current_stage": "followup_active",
                "last_contacted_at": datetime.now(timezone.utc),
            })
        except Exception as e:
            logger.error(f"Failed to update lead {lead_id[:8]} after nurturing: {e}")

        async with async_session_maker() as session:
            activity = Activity(
                lead_id=lead_id,
                activity_type=ActivityType.FOLLOWUP_SENT,
                title="WhatsApp Follow-up Generated",
                description=message[:200] if message else "AI-generated follow-up message ready",
                meta_data={
                    "channel": "whatsapp",
                    "message_preview": message[:200] if message else "",
                    "whatsapp_url": whatsapp_url,
                    "phone": recipient_phone,
                    "score": score,
                    "priority": priority,
                },
            )
            session.add(activity)
            await session.commit()

        logger.info(f"=== Workflow: WhatsApp follow-up generated for lead {lead_id[:8]}. URL ready. ===")

        return state

    except Exception as e:
        logger.error(f"=== Workflow ERROR in lead_nurturing_node for lead {lead_id[:8]}: {str(e)} ===")
        state["status"] = "nurturing_failed"
        return state
