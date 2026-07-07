import logging
from app.services.workflows.state import LeadState
from app.core.database.session import async_session_maker
from app.models import Activity, ActivityType

logger = logging.getLogger(__name__)


async def decision_node(state: LeadState) -> LeadState:
    lead_id = str(state.get("lead_id", ""))
    try:
        customer_responded = state.get("customer_responded", False)

        if customer_responded:
            state["current_stage"] = "customer_responded"
            state["status"] = "customer_responded"

            async with async_session_maker() as session:
                activity = Activity(
                    lead_id=lead_id,
                    activity_type=ActivityType.CUSTOMER_RESPONDED,
                    title="Customer Responded",
                    description=f"Customer responded to follow-up communication",
                    meta_data={
                        "name": state.get("name"),
                        "phone": state.get("phone"),
                        "current_stage": state.get("current_stage"),
                    },
                )
                session.add(activity)
                await session.commit()

            logger.info(f"=== Workflow: Customer responded for lead {lead_id[:8]}. Stopping follow-up journey. ===")
        else:
            state["current_stage"] = "followup_active"
            state["status"] = "continuing_journey"
            logger.info(f"=== Workflow: No response yet for lead {lead_id[:8]}. Continuing follow-up journey. ===")

        return state
    except Exception as e:
        logger.error(f"=== Workflow ERROR in decision_node for {lead_id[:8]}: {str(e)} ===")
        return state
