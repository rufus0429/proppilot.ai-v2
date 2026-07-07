import logging
from app.services.agents.lead_scoring import score_lead
from app.services.workflows.state import LeadState
from app.core.database.session import async_session_maker
from app.models import Activity, ActivityType

logger = logging.getLogger(__name__)


async def score_lead_node(state: LeadState) -> LeadState:
    lead_id = str(state.get("lead_id", ""))
    try:
        logger.info(f"=== Workflow: Lead Scoring - calculating score for {lead_id[:8]} ===")
        result = await score_lead(
            name=state.get("name"),
            budget_min=state.get("budget_min"),
            budget_max=state.get("budget_max"),
            location=state.get("location"),
            property_type=state.get("property_type"),
            timeline=state.get("timeline"),
            financing_required=state.get("financing_required", False),
            intent=state.get("intent"),
            source=state.get("source"),
        )

        state["lead_score"] = result.get("score", 0)
        state["priority"] = result.get("priority", "cold")
        state["score_explanation"] = result.get("explanation", "")
        if result.get("priority") == "hot":
            state["current_stage"] = "hot_lead"

        async with async_session_maker() as session:
            activity = Activity(
                lead_id=lead_id,
                activity_type=ActivityType.LEAD_SCORED,
                title=f"Lead Score {state['lead_score']} ({state['priority'].upper()})",
                description=state.get("score_explanation", ""),
                meta_data={"score": state["lead_score"], "priority": state["priority"]},
            )
            session.add(activity)
            await session.commit()

        logger.info(f"=== Workflow: Lead Score Generated for {lead_id[:8]}: score={state['lead_score']}, priority={state['priority']} ===")

        return state
    except Exception as e:
        logger.error(f"=== Workflow ERROR in score_lead_node for {lead_id[:8]}: {str(e)} ===")
        state["lead_score"] = 0
        state["priority"] = "cold"
        return state
