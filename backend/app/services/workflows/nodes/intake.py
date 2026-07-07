import logging
from app.services.agents.lead_intake import validate_inquiry_form, check_duplicate, prepare_lead_data
from app.services.workflows.state import LeadState
from app.db.repositories.leads import LeadRepository
from app.core.database.session import async_session_maker
from app.models import Activity, ActivityType

logger = logging.getLogger(__name__)


async def lead_intake_node(state: LeadState) -> LeadState:
    lead_id = str(state.get("lead_id", ""))
    try:
        form_data = state.get("inquiry_data") or {}
        if not form_data:
            logger.warning(f"=== Workflow: No inquiry data for lead {lead_id[:8]} ===")
            state["workflow_status"] = "failed"
            state["error"] = "No inquiry data provided"
            return state

        valid, error_msg = validate_inquiry_form(form_data)
        if not valid:
            logger.warning(f"=== Workflow: Validation failed for lead {lead_id[:8]}: {error_msg} ===")
            state["workflow_status"] = "failed"
            state["error"] = error_msg
            return state

        logger.info(f"=== Workflow: Lead Intake - checking duplicates for {lead_id[:8]} ===")
        repo = LeadRepository()
        is_dup, dup_id = await check_duplicate(
            phone=form_data.get("phone", ""),
            email=form_data.get("email"),
            lead_repo=repo,
        )

        if is_dup:
            logger.info(f"=== Workflow: Duplicate lead detected for {lead_id[:8]}. Existing ID: {dup_id} ===")
            state["is_duplicate"] = True
            state["current_stage"] = "new_lead"
            state["workflow_status"] = "completed"
            state["status"] = "duplicate_found"
            return state

        logger.info(f"=== Workflow: Lead Intake - preparing lead data for {lead_id[:8]} ===")
        lead_data = prepare_lead_data(form_data)
        state["name"] = lead_data.get("name")
        state["phone"] = lead_data.get("phone")
        state["email"] = lead_data.get("email")
        state["budget_min"] = lead_data.get("budget_min")
        state["budget_max"] = lead_data.get("budget_max")
        state["location"] = lead_data.get("location")
        state["preferred_area"] = lead_data.get("preferred_area")
        state["property_type"] = lead_data.get("property_type")
        state["bedrooms"] = lead_data.get("bedrooms")
        state["timeline"] = lead_data.get("timeline")
        state["financing_required"] = lead_data.get("financing_required", False)
        state["intent"] = lead_data.get("intent")
        state["source"] = lead_data.get("source")
        state["inquiry_data"] = lead_data.get("inquiry_data")

        async with async_session_maker() as session:
            activity = Activity(
                lead_id=lead_id,
                activity_type=ActivityType.LEAD_INTAKE_COMPLETED,
                title="Lead Intake Completed",
                description=f"Intake completed for {state.get('name', 'Unknown')} from {state.get('source', 'unknown')}",
                meta_data={
                    "name": state.get("name"),
                    "phone": state.get("phone"),
                    "email": state.get("email"),
                    "source": state.get("source"),
                    "location": state.get("location"),
                    "property_type": state.get("property_type"),
                },
            )
            session.add(activity)
            await session.commit()

        logger.info(f"=== Workflow: Lead Intake completed for {lead_id[:8]} ===")
        return state
    except Exception as e:
        logger.error(f"=== Workflow ERROR in lead_intake_node for {lead_id[:8]}: {str(e)} ===")
        state["error"] = str(e)
        state["workflow_status"] = "failed"
        return state
