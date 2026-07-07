from langgraph.graph import StateGraph, END
from app.services.workflows.state import LeadState
from app.services.workflows.nodes.intake import lead_intake_node
from app.services.workflows.nodes.qualification import qualify_lead_node
from app.services.workflows.nodes.scoring import score_lead_node
from app.services.workflows.nodes.recommendation import recommend_properties_node
from app.services.workflows.nodes.nurturing import lead_nurturing_node
from app.services.workflows.nodes.decision import decision_node
from app.core.database.session import async_session_maker
from app.models import Activity, ActivityType
import logging

logger = logging.getLogger(__name__)


def route_after_intake(state: LeadState) -> str:
    if state.get("is_duplicate"):
        logger.info(f"=== Workflow: Lead {str(state.get('lead_id', ''))[:8]} is duplicate, ending workflow ===")
        return "end"
    logger.info(f"=== Workflow: Intake complete → Proceeding to Qualification ===")
    return "qualify"


def route_after_qualification(state: LeadState) -> str:
    logger.info(f"=== Workflow: Lead Qualified → Proceeding to Scoring ===")
    return "score"


def route_after_scoring(state: LeadState) -> str:
    logger.info(f"=== Workflow: Score Generated → Proceeding to Recommendation ===")
    return "recommend"


def route_after_recommendation(state: LeadState) -> str:
    logger.info(f"=== Workflow: Recommendation Generated → Proceeding to Nurturing ===")
    return "nurture"


def route_after_nurturing(state: LeadState) -> str:
    logger.info(f"=== Workflow: Nurturing complete → Proceeding to Decision ===")
    return "decision"


def route_after_decision(state: LeadState) -> str:
    if state.get("customer_responded"):
        logger.info(f"=== Workflow: Customer responded, ending follow-up journey ===")
        return "customer_responded"
    logger.info(f"=== Workflow: No response yet, scheduling next follow-up ===")
    return "continue_followup"


def create_lead_workflow() -> StateGraph:
    workflow = StateGraph(LeadState)

    workflow.add_node("lead_intake", lead_intake_node)
    workflow.add_node("qualify_lead", qualify_lead_node)
    workflow.add_node("score_lead", score_lead_node)
    workflow.add_node("recommend_properties", recommend_properties_node)
    workflow.add_node("lead_nurturing", lead_nurturing_node)
    workflow.add_node("decision", decision_node)

    workflow.set_entry_point("lead_intake")

    workflow.add_conditional_edges(
        "lead_intake",
        route_after_intake,
        {"qualify": "qualify_lead", "end": END},
    )

    workflow.add_conditional_edges(
        "qualify_lead",
        route_after_qualification,
        {"score": "score_lead", "end": END},
    )

    workflow.add_conditional_edges(
        "score_lead",
        route_after_scoring,
        {"recommend": "recommend_properties", "end": END},
    )

    workflow.add_conditional_edges(
        "recommend_properties",
        route_after_recommendation,
        {"nurture": "lead_nurturing", "end": END},
    )

    workflow.add_conditional_edges(
        "lead_nurturing",
        route_after_nurturing,
        {"decision": "decision", "end": END},
    )

    workflow.add_conditional_edges(
        "decision",
        route_after_decision,
        {"customer_responded": END, "continue_followup": END},
    )

    return workflow.compile()


lead_workflow = create_lead_workflow()


async def execute_lead_workflow(lead_data: dict) -> dict:
    try:
        lead_id = str(lead_data.get("lead_id", ""))
        logger.info(f"=== Workflow: Started for lead {lead_id[:8]} ===")

        async with async_session_maker() as session:
            activity = Activity(
                lead_id=lead_id,
                activity_type=ActivityType.WORKFLOW_STARTED,
                title="Workflow Started",
                description=f"Lead workflow initiated for {lead_data.get('name', 'Unknown')} from {lead_data.get('source', 'unknown')}",
                meta_data={
                    "name": lead_data.get("name"),
                    "phone": lead_data.get("phone"),
                    "email": lead_data.get("email"),
                    "source": lead_data.get("source"),
                    "location": lead_data.get("location"),
                    "property_type": lead_data.get("property_type"),
                },
            )
            session.add(activity)
            await session.commit()

        initial_state: LeadState = {
            "lead_id": lead_data.get("lead_id"),
            "message": lead_data.get("message", ""),
            "name": lead_data.get("name"),
            "phone": lead_data.get("phone"),
            "email": lead_data.get("email"),
            "budget_min": lead_data.get("budget_min"),
            "budget_max": lead_data.get("budget_max"),
            "location": lead_data.get("location"),
            "preferred_area": lead_data.get("preferred_area"),
            "property_type": lead_data.get("property_type"),
            "bedrooms": lead_data.get("bedrooms"),
            "timeline": lead_data.get("timeline"),
            "financing_required": lead_data.get("financing_required", False),
            "intent": lead_data.get("intent"),
            "source": lead_data.get("source"),
            "lead_score": 0,
            "priority": "cold",
            "score_explanation": None,
            "recommendations": [],
            "journey": [],
            "status": "pending",
            "error": None,
            "current_stage": "new_lead",
            "workflow_status": "running",
            "is_duplicate": False,
            "customer_responded": False,
            "inquiry_data": lead_data.get("inquiry_data"),
        }

        logger.info(f"=== Workflow: Executing LangGraph pipeline for lead {lead_id[:8]} ===")
        result = await lead_workflow.ainvoke(initial_state)

        if result.get("workflow_status") != "failed":
            result["workflow_status"] = "completed"

        logger.info(f"=== Workflow: Completed for lead {lead_id[:8]}. Final stage: {result.get('current_stage')}, Score: {result.get('lead_score')}, Priority: {result.get('priority')} ===")

        return result
    except Exception as e:
        logger.error(f"=== Workflow FAILED for lead {str(lead_data.get('lead_id', ''))[:8]}: {str(e)} ===")
        return {
            **lead_data,
            "lead_score": 0,
            "priority": "cold",
            "recommendations": [],
            "journey": [],
            "status": "failed",
            "workflow_status": "failed",
            "current_stage": "new_lead",
            "error": str(e),
        }
