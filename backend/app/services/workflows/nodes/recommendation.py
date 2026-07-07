import logging
from app.services.agents.property_recommendation import recommend_properties
from app.services.workflows.state import LeadState
from app.db.repositories.properties import PropertyRepository
from app.core.database.session import async_session_maker
from app.models import Activity, ActivityType

logger = logging.getLogger(__name__)


async def recommend_properties_node(state: LeadState) -> LeadState:
    lead_id = str(state.get("lead_id", ""))
    try:
        logger.info(f"=== Workflow: Property Recommendation - searching for lead {lead_id[:8]} ===")

        repo = PropertyRepository()
        available_properties = await repo.get_active_properties()

        logger.info(f"=== Workflow: Found {len(available_properties)} available properties ===")

        if not available_properties:
            logger.warning(f"=== Workflow: No properties in database to recommend for {lead_id[:8]} ===")
            state["recommendations"] = []
            state["current_stage"] = "recommendation_sent"
            return state

        recommendations = recommend_properties(
            properties=[{
                "id": str(p.id), "name": p.name, "location": p.location,
                "price": float(p.price), "bedrooms": p.bedrooms,
                "property_type": p.property_type.value if hasattr(p.property_type, 'value') else p.property_type,
            } for p in available_properties],
            budget_min=state.get("budget_min"),
            budget_max=state.get("budget_max"),
            location=state.get("location"),
            property_type=state.get("property_type"),
            bedrooms=state.get("bedrooms"),
        )

        state["recommendations"] = recommendations
        state["current_stage"] = "recommendation_sent"

        async with async_session_maker() as session:
            activity = Activity(
                lead_id=lead_id,
                activity_type=ActivityType.PROPERTY_RECOMMENDED,
                title=f"{len(recommendations)} Properties Recommended",
                description=f"Recommended {len(recommendations)} properties for {state.get('name', 'Unknown')} in {state.get('location', 'N/A')}",
                meta_data={
                    "count": len(recommendations),
                    "location": state.get("location"),
                    "property_type": state.get("property_type"),
                    "budget_min": state.get("budget_min"),
                    "budget_max": state.get("budget_max"),
                    "bedrooms": state.get("bedrooms"),
                },
            )
            session.add(activity)
            await session.commit()

        logger.info(f"=== Workflow: Property Recommendation Generated for {lead_id[:8]}: {len(recommendations)} matches found ===")

        return state
    except Exception as e:
        logger.error(f"=== Workflow ERROR in recommend_properties_node for {lead_id[:8]}: {str(e)} ===")
        state["recommendations"] = []
        state["current_stage"] = "recommendation_sent"
        return state
