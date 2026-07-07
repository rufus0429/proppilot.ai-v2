from typing import TypedDict, Optional, Any, Dict, List
from uuid import UUID


class LeadState(TypedDict):
    lead_id: UUID
    message: str
    name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    budget_min: Optional[float]
    budget_max: Optional[float]
    location: Optional[str]
    preferred_area: Optional[str]
    property_type: Optional[str]
    bedrooms: Optional[int]
    timeline: Optional[str]
    financing_required: bool
    intent: Optional[str]
    source: Optional[str]
    lead_score: int
    priority: str
    score_explanation: Optional[str]
    recommendations: List[Dict[str, Any]]
    journey: List[Dict[str, Any]]
    status: str
    error: Optional[str]
    current_stage: str
    workflow_status: str
    is_duplicate: bool
    customer_responded: bool
    inquiry_data: Optional[Dict[str, Any]]
    whatsapp_message: Optional[str]
    whatsapp_url: Optional[str]
    whatsapp_phone: Optional[str]
