from fastapi import APIRouter, HTTPException, Depends, Query, status, BackgroundTasks
from uuid import UUID
from typing import Optional
from app.schemas.schemas import (
    PropertyInquiryForm,
    InquirySubmitResponse,
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadListResponse,
    LeadQualificationInput,
    LeadQualificationOutput,
    LeadScoringOutput,
    JourneyResponse,
    JourneyStep,
    DashboardStats,
    ActivityResponse,
)
from app.db.repositories.leads import LeadRepository
from app.db.repositories.properties import PropertyRepository
from app.core.auth.dependencies import get_current_user_id
from app.services.agents.lead_qualification import qualify_lead
from app.services.agents.lead_scoring import score_lead
from app.services.agents.property_recommendation import recommend_properties
from app.services.agents.journey_builder import generate_journey
from app.services.workflows.lead_workflow import execute_lead_workflow
from app.services.followup_agent import execute_followup
from app.models import LeadSource, LeadStage, Activity, ActivityType, WorkflowStatus, FollowUpSequence, SequenceStatus
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leads", tags=["Leads"])
lead_repo = LeadRepository()
property_repo = PropertyRepository()


@router.post("/inquiry", response_model=InquirySubmitResponse)
async def submit_property_inquiry(form: PropertyInquiryForm, background_tasks: BackgroundTasks = None):
    try:
        form_dict = form.model_dump()

        lead_data = {
            "name": form_dict["name"],
            "phone": form_dict["phone"],
            "email": form_dict.get("email"),
            "budget_min": form_dict.get("budget_min"),
            "budget_max": form_dict.get("budget_max"),
            "location": form_dict.get("city"),
            "preferred_area": form_dict.get("area"),
            "property_type": form_dict.get("property_type"),
            "bedrooms": form_dict.get("bedrooms"),
            "timeline": form_dict.get("timeline"),
            "financing_required": form_dict.get("financing_required", False),
            "source": form_dict.get("source", "website"),
            "current_stage": "new_lead",
            "workflow_status": "running",
            "inquiry_data": form_dict,
        }

        intent_parts = []
        if form_dict.get("property_type"):
            intent_parts.append(f"Looking for {form_dict['property_type']}")
        if form_dict.get("city"):
            intent_parts.append(f"in {form_dict['city']}")
            if form_dict.get("area"):
                intent_parts[-1] += f" ({form_dict['area']})"
        if form_dict.get("budget_min") or form_dict.get("budget_max"):
            intent_parts.append(f"Budget: ₹{form_dict.get('budget_min', '?')}L - ₹{form_dict.get('budget_max', '?')}L")
        if form_dict.get("bedrooms"):
            intent_parts.append(f"{form_dict['bedrooms']} BHK")
        if form_dict.get("timeline"):
            intent_parts.append(f"Timeline: {form_dict['timeline']}")
        if form_dict.get("notes"):
            intent_parts.append(f"Notes: {form_dict['notes']}")
        lead_data["intent"] = ". ".join(intent_parts)

        timeline_map = {
            "immediately": "immediate",
            "within_1_month": "1 month",
            "within_3_months": "3 months",
            "within_6_months": "6 months",
            "just_exploring": "exploring",
        }
        lead_data["timeline"] = timeline_map.get(form_dict.get("timeline", ""), form_dict.get("timeline", ""))

        lead = await lead_repo.create(lead_data)

        try:
            workflow_result = await execute_lead_workflow({
                "lead_id": lead.id,
                "message": lead.intent or "",
                "name": lead.name,
                "phone": lead.phone,
                "email": lead.email,
                "budget_min": float(lead.budget_min) if lead.budget_min else None,
                "budget_max": float(lead.budget_max) if lead.budget_max else None,
                "location": lead.location,
                "preferred_area": lead.preferred_area,
                "property_type": lead.property_type.value if lead.property_type else None,
                "bedrooms": lead.bedrooms,
                "timeline": lead.timeline,
                "financing_required": lead.financing_required,
                "intent": lead.intent,
                "source": lead.source.value if hasattr(lead.source, 'value') else lead.source,
                "inquiry_data": form_dict,
            })

            update_data = {}
            if workflow_result.get("budget_min") is not None:
                update_data["budget_min"] = workflow_result["budget_min"]
            if workflow_result.get("budget_max") is not None:
                update_data["budget_max"] = workflow_result["budget_max"]
            if workflow_result.get("location"):
                update_data["location"] = workflow_result["location"]
            if workflow_result.get("property_type"):
                update_data["property_type"] = workflow_result["property_type"]
            if workflow_result.get("timeline"):
                update_data["timeline"] = workflow_result["timeline"]
            if workflow_result.get("financing_required") is not None:
                update_data["financing_required"] = workflow_result["financing_required"]
            if workflow_result.get("intent"):
                update_data["intent"] = workflow_result["intent"]
            if workflow_result.get("lead_score") is not None:
                update_data["lead_score"] = workflow_result["lead_score"]
            if workflow_result.get("priority"):
                update_data["priority"] = workflow_result["priority"]
            if workflow_result.get("current_stage"):
                update_data["current_stage"] = workflow_result["current_stage"]
            wf_status = workflow_result.get("workflow_status", "completed")
            update_data["workflow_status"] = "completed" if wf_status != "failed" else "failed"

            if update_data:
                await lead_repo.update(lead.id, update_data)

            recommendations = workflow_result.get("recommendations", [])

        except Exception as workflow_error:
            logger.error(f"Workflow execution error: {workflow_error}")
            await lead_repo.update(lead.id, {"workflow_status": "failed"})
            recommendations = []

        if "workflow_result" in locals():
            logger.info(f"DEBUG workflow keys: {list(workflow_result.keys())}")
            logger.info(f"DEBUG whatsapp_url: {workflow_result.get('whatsapp_url')}")
            logger.info(f"DEBUG current_stage: {workflow_result.get('current_stage')}")
            logger.info(f"DEBUG lead_score: {workflow_result.get('lead_score')}")
        whatsapp_url = workflow_result.get("whatsapp_url", "") if "workflow_result" in locals() else ""
        whatsapp_message = workflow_result.get("whatsapp_message", "") if "workflow_result" in locals() else ""

        return InquirySubmitResponse(
            success=True,
            message="Your property inquiry has been received! Our AI is matching the best properties for you.",
            lead_id=lead.id,
            recommendations=recommendations[:3] if recommendations else [],
            whatsapp_url=whatsapp_url,
            whatsapp_message=whatsapp_message,
        )

    except Exception as e:
        logger.error(f"Error submitting inquiry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit inquiry: {str(e)}",
        )


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead_data: LeadCreate,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        lead_dict = lead_data.model_dump(exclude_none=True)
        message = lead_dict.pop("message", None)
        if message:
            lead_dict["intent"] = message

        if "current_stage" not in lead_dict:
            lead_dict["current_stage"] = "new_lead"
        lead_dict["workflow_status"] = "pending"

        lead = await lead_repo.create(lead_dict)

        if message:
            try:
                workflow_result = await execute_lead_workflow({
                    "lead_id": lead.id,
                    "message": message,
                    "name": lead.name,
                    "phone": lead.phone,
                    "email": lead.email,
                    "source": lead.source.value if hasattr(lead.source, 'value') else lead.source,
                })

                update_data = {}
                if workflow_result.get("budget_min") is not None:
                    update_data["budget_min"] = workflow_result["budget_min"]
                if workflow_result.get("budget_max") is not None:
                    update_data["budget_max"] = workflow_result["budget_max"]
                if workflow_result.get("location"):
                    update_data["location"] = workflow_result["location"]
                if workflow_result.get("property_type"):
                    update_data["property_type"] = workflow_result["property_type"]
                if workflow_result.get("timeline"):
                    update_data["timeline"] = workflow_result["timeline"]
                if workflow_result.get("financing_required") is not None:
                    update_data["financing_required"] = workflow_result["financing_required"]
                if workflow_result.get("intent"):
                    update_data["intent"] = workflow_result["intent"]
                if workflow_result.get("lead_score") is not None:
                    update_data["lead_score"] = workflow_result["lead_score"]
                if workflow_result.get("priority"):
                    update_data["priority"] = workflow_result["priority"]
                if workflow_result.get("current_stage"):
                    update_data["current_stage"] = workflow_result["current_stage"]
                update_data["workflow_status"] = "completed"

                if update_data:
                    await lead_repo.update(lead.id, update_data)

            except Exception as workflow_error:
                logger.error(f"Workflow execution error: {workflow_error}")

        lead = await lead_repo.get_by_id(lead.id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        return lead
    except Exception as e:
        logger.error(f"Error creating lead: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create lead: {str(e)}",
        )


@router.get("", response_model=LeadListResponse)
async def list_leads(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    source: Optional[str] = None,
    user_id: UUID = Depends(get_current_user_id),
):
    items, total = await lead_repo.get_all(
        page=page,
        size=size,
        status=status,
        priority=priority,
        search=search,
        source=source,
    )
    return LeadListResponse(items=items, total=total, page=page, size=size)


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    user_id: UUID = Depends(get_current_user_id),
):
    return await lead_repo.get_dashboard_stats()


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    lead_data: LeadUpdate,
    user_id: UUID = Depends(get_current_user_id),
):
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_dict = lead_data.model_dump(exclude_none=True)
    if update_dict:
        lead = await lead_repo.update(lead_id, update_dict)
    return lead


@router.post("/{lead_id}/qualify", response_model=LeadQualificationOutput)
async def qualify_lead_endpoint(
    lead_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    result = await qualify_lead(lead.intent or "")

    update_data = {}
    if result.get("name"):
        update_data["name"] = result["name"]
    if result.get("budget_min"):
        update_data["budget_min"] = result["budget_min"]
    if result.get("budget_max"):
        update_data["budget_max"] = result["budget_max"]
    if result.get("location"):
        update_data["location"] = result["location"]
    if result.get("property_type"):
        update_data["property_type"] = result["property_type"]
    if result.get("timeline"):
        update_data["timeline"] = result["timeline"]
    if result.get("financing_required") is not None:
        update_data["financing_required"] = result["financing_required"]
    if result.get("intent"):
        update_data["intent"] = result["intent"]
    update_data["current_stage"] = "qualified"

    await lead_repo.update(lead_id, update_data)
    return result


@router.post("/{lead_id}/score", response_model=LeadScoringOutput)
async def score_lead_endpoint(
    lead_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    result = await score_lead(
        name=lead.name,
        budget_min=float(lead.budget_min) if lead.budget_min else None,
        budget_max=float(lead.budget_max) if lead.budget_max else None,
        location=lead.location,
        property_type=lead.property_type.value if lead.property_type else None,
        timeline=lead.timeline,
        financing_required=lead.financing_required,
        intent=lead.intent,
        source=lead.source.value if lead.source else None,
    )

    update_data = {
        "lead_score": result["score"],
        "priority": result["priority"],
    }
    if result.get("priority") == "hot":
        update_data["current_stage"] = "hot_lead"

    await lead_repo.update(lead_id, update_data)

    return result


@router.post("/{lead_id}/recommend")
async def recommend_properties_endpoint(
    lead_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    properties_data = []
    all_properties, _ = await property_repo.get_all(size=1000)
    for prop in all_properties:
        properties_data.append({
            "id": str(prop.id),
            "name": prop.name,
            "location": prop.location,
            "price": float(prop.price),
            "property_type": prop.property_type.value if hasattr(prop.property_type, 'value') else prop.property_type,
            "bedrooms": prop.bedrooms,
            "description": prop.description or "",
        })

    result = await recommend_properties(
        budget_min=float(lead.budget_min) if lead.budget_min else None,
        budget_max=float(lead.budget_max) if lead.budget_max else None,
        location=lead.location,
        property_type=lead.property_type.value if lead.property_type else None,
        timeline=lead.timeline,
        intent=lead.intent,
        properties_data=properties_data,
    )

    if result:
        await lead_repo.update(lead_id, {"current_stage": "recommendation_sent"})

    return {"recommendations": result}


@router.post("/{lead_id}/journey", response_model=JourneyResponse)
async def generate_journey_endpoint(
    lead_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    journey = await generate_journey(
        name=lead.name,
        budget_min=float(lead.budget_min) if lead.budget_min else None,
        budget_max=float(lead.budget_max) if lead.budget_max else None,
        property_type=lead.property_type.value if lead.property_type else None,
        location=lead.location,
        timeline=lead.timeline,
        score=lead.lead_score or 0,
        priority=lead.priority.value if lead.priority else "cold",
        intent=lead.intent,
    )

    return JourneyResponse(sequence=journey)


@router.post("/{lead_id}/workflow")
async def execute_full_workflow(
    lead_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    result = await execute_lead_workflow({
        "lead_id": lead.id,
        "message": lead.intent or "",
        "name": lead.name,
        "phone": lead.phone,
        "email": lead.email,
        "budget_min": float(lead.budget_min) if lead.budget_min else None,
        "budget_max": float(lead.budget_max) if lead.budget_max else None,
        "location": lead.location,
        "preferred_area": lead.preferred_area,
        "property_type": lead.property_type.value if lead.property_type else None,
        "bedrooms": lead.bedrooms,
        "timeline": lead.timeline,
        "financing_required": lead.financing_required,
        "intent": lead.intent,
        "source": lead.source.value if lead.source else None,
    })

    update_data = {}
    if result.get("budget_min") is not None:
        update_data["budget_min"] = result["budget_min"]
    if result.get("budget_max") is not None:
        update_data["budget_max"] = result["budget_max"]
    if result.get("location"):
        update_data["location"] = result["location"]
    if result.get("property_type"):
        update_data["property_type"] = result["property_type"]
    if result.get("timeline"):
        update_data["timeline"] = result["timeline"]
    if result.get("financing_required") is not None:
        update_data["financing_required"] = result["financing_required"]
    if result.get("intent"):
        update_data["intent"] = result["intent"]
    if result.get("lead_score") is not None:
        update_data["lead_score"] = result["lead_score"]
    if result.get("priority"):
        update_data["priority"] = result["priority"]
    if result.get("current_stage"):
        update_data["current_stage"] = result["current_stage"]
    if result.get("workflow_status"):
        update_data["workflow_status"] = result["workflow_status"]

    if update_data:
        await lead_repo.update(lead_id, update_data)

    return result


@router.post("/{lead_id}/responded")
async def customer_responded(
    lead_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    now = datetime.now(timezone.utc)

    # Stop active follow-up sequences
    async with async_session_maker() as session:
        from sqlalchemy import update as sql_update
        stmt = (
            sql_update(FollowUpSequence)
            .where(FollowUpSequence.lead_id == str(lead_id))
            .where(FollowUpSequence.status == SequenceStatus.ACTIVE)
            .values(
                status=SequenceStatus.STOPPED,
                stopped_at=now,
                stop_reason="Customer replied",
            )
        )
        await session.execute(stmt)
        await session.commit()

    await lead_repo.update(lead_id, {
        "current_stage": "customer_responded",
        "customer_responded_at": now,
        "last_contacted_at": now,
        "workflow_status": "completed",
    })

    # Log customer response activity
    async with async_session_maker() as session:
        activity = Activity(
            lead_id=str(lead_id),
            activity_type=ActivityType.CUSTOMER_RESPONDED,
            title="Customer Replied — Follow-ups Stopped",
            description=f"Customer responded. All automated follow-up sequences stopped. Sales team notified.",
            meta_data={"responded_at": now.isoformat()},
        )
        session.add(activity)
        await session.commit()

    logger.info(f"Customer response recorded for lead {str(lead_id)[:8]}. Follow-ups stopped.")

    return {
        "message": "Customer response recorded. Follow-up journey stopped. Sales team notified.",
        "lead_id": str(lead_id),
    }


@router.get("/{lead_id}/activities", response_model=list[ActivityResponse])
async def get_lead_activities(
    lead_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    from sqlalchemy import select
    from app.core.database.session import async_session_maker

    async with async_session_maker() as session:
        stmt = (
            select(Activity)
            .where(Activity.lead_id == lead_id)
            .order_by(Activity.created_at.desc())
            .limit(50)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())
