from app.services.agents.journey_builder import generate_journey
from app.services.workflows.state import LeadState
import logging

logger = logging.getLogger(__name__)


async def journey_builder_node(state: LeadState) -> LeadState:
    try:
        journey = await generate_journey(
            name=state.get("name"),
            budget_min=state.get("budget_min"),
            budget_max=state.get("budget_max"),
            property_type=state.get("property_type"),
            location=state.get("location"),
            timeline=state.get("timeline"),
            score=state.get("lead_score", 0),
            priority=state.get("priority", "cold"),
            intent=state.get("intent"),
        )

        state["journey"] = journey
        state["status"] = "journey_created"
        return state
    except Exception as e:
        logger.error(f"Error in journey_builder_node: {str(e)}")
        state["journey"] = []
        return state
