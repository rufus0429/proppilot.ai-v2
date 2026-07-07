import logging
from app.services.agents.lead_qualification import qualify_lead
from app.services.workflows.state import LeadState
from app.core.database.session import async_session_maker
from app.models import Activity, ActivityType

logger = logging.getLogger(__name__)


async def qualify_lead_node(state: LeadState) -> LeadState:
    lead_id = str(state.get("lead_id", ""))
    try:
        message = state.get("message", "")

        if message:
            try:
                logger.info(f"=== Workflow: Lead Qualification - extracting info for {lead_id[:8]} ===")
                extracted = await qualify_lead(message)
                logger.info(f"=== Workflow: Qualification extraction complete for {lead_id[:8]} ===")

                state["name"] = extracted.get("name") or state.get("name")
                state["budget_min"] = extracted.get("budget_min") or state.get("budget_min")
                state["budget_max"] = extracted.get("budget_max") or state.get("budget_max")
                state["location"] = extracted.get("location") or state.get("location")
                state["property_type"] = extracted.get("property_type") or state.get("property_type")
                state["timeline"] = extracted.get("timeline") or state.get("timeline")
                state["financing_required"] = extracted.get("financing_required", False)
                state["intent"] = extracted.get("intent") or state.get("intent")
            except Exception as e:
                logger.warning(f"=== Workflow: Qualification extraction error for {lead_id[:8]}: {e}. Using intake data. ===")

        state["current_stage"] = "qualified"

        async with async_session_maker() as session:
            activity = Activity(
                lead_id=lead_id,
                activity_type=ActivityType.LEAD_QUALIFIED,
                title="Lead Qualified",
                description=f"Lead qualified with intent: {state.get('intent', 'N/A')[:100] if state.get('intent') else 'N/A'}",
                meta_data={
                    "name": state.get("name"),
                    "phone": state.get("phone"),
                    "budget_min": state.get("budget_min"),
                    "budget_max": state.get("budget_max"),
                    "location": state.get("location"),
                    "property_type": state.get("property_type"),
                    "timeline": state.get("timeline"),
                    "financing_required": state.get("financing_required"),
                    "intent": state.get("intent"),
                },
            )
            session.add(activity)
            await session.commit()

        logger.info(f"=== Workflow: Lead Qualified for {lead_id[:8]} ===")

        return state
    except Exception as e:
        logger.error(f"=== Workflow ERROR in qualify_lead_node for {lead_id[:8]}: {str(e)} ===")
        state["current_stage"] = "qualified"
        return state
