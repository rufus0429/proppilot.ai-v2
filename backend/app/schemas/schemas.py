from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from uuid import UUID
from enum import Enum


class LeadSourceEnum(str, Enum):
    website = "website"
    instagram = "instagram"
    facebook = "facebook"
    whatsapp = "whatsapp"
    landing_page = "landing_page"
    referral = "referral"
    manual = "manual"
    other = "other"


class LeadStageEnum(str, Enum):
    new_lead = "new_lead"
    qualified = "qualified"
    hot_lead = "hot_lead"
    recommendation_sent = "recommendation_sent"
    followup_active = "followup_active"
    customer_responded = "customer_responded"
    site_visit_scheduled = "site_visit_scheduled"
    negotiation = "negotiation"
    booked = "booked"
    lost = "lost"


class WorkflowStatusEnum(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class LeadPriorityEnum(str, Enum):
    hot = "hot"
    warm = "warm"
    cold = "cold"


class PropertyTypeEnum(str, Enum):
    apartment = "apartment"
    villa = "villa"
    plot = "plot"
    commercial = "commercial"
    office = "office"


class ChannelEnum(str, Enum):
    whatsapp = "whatsapp"
    email = "email"
    sms = "sms"
    call = "call"
    internal_task = "internal_task"


# === Auth Schemas ===
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: int


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: Any


class UserProfile(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


# === Property Inquiry Form Schema ===
class PropertyInquiryForm(BaseModel):
    property_type: PropertyTypeEnum
    city: str = Field(..., min_length=1, max_length=255)
    area: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    bedrooms: Optional[int] = None
    timeline: str = Field(..., description="immediately|within_1_month|within_3_months|within_6_months|just_exploring")
    financing_required: bool = False
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[str] = None
    notes: Optional[str] = None
    source: LeadSourceEnum = LeadSourceEnum.website


class InquirySubmitResponse(BaseModel):
    success: bool
    message: str
    lead_id: Optional[UUID] = None
    inquiry_id: Optional[str] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    whatsapp_url: Optional[str] = None
    whatsapp_message: Optional[str] = None


# === Lead Schemas ===
class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    location: Optional[str] = None
    preferred_area: Optional[str] = None
    property_type: Optional[PropertyTypeEnum] = None
    bedrooms: Optional[int] = None
    timeline: Optional[str] = None
    financing_required: bool = False
    intent: Optional[str] = None
    source: LeadSourceEnum = LeadSourceEnum.other
    message: Optional[str] = None
    inquiry_data: Optional[Dict[str, Any]] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    location: Optional[str] = None
    preferred_area: Optional[str] = None
    property_type: Optional[PropertyTypeEnum] = None
    bedrooms: Optional[int] = None
    timeline: Optional[str] = None
    financing_required: Optional[bool] = None
    current_stage: Optional[LeadStageEnum] = None
    assigned_to: Optional[UUID] = None


class LeadResponse(BaseModel):
    id: UUID
    name: str
    phone: str
    email: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    location: Optional[str] = None
    preferred_area: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    timeline: Optional[str] = None
    financing_required: bool
    intent: Optional[str] = None
    source: str
    current_stage: str
    lead_score: int
    priority: str
    workflow_status: str
    is_duplicate: bool
    assigned_to: Optional[UUID] = None
    assigned_to_user: Optional[UserProfile] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    qualified_at: Optional[datetime] = None
    last_contacted_at: Optional[datetime] = None
    customer_responded_at: Optional[datetime] = None
    whatsapp_status: Optional[str] = "pending"
    email_status: Optional[str] = "pending"
    whatsapp_sent_at: Optional[datetime] = None
    email_sent_at: Optional[datetime] = None
    last_followup_at: Optional[datetime] = None
    followup_retry_count: Optional[int] = 0

    class Config:
        from_attributes = True


class LeadListResponse(BaseModel):
    items: List[LeadResponse]
    total: int
    page: int
    size: int


# === Property Schemas ===
class PropertyCreate(BaseModel):
    name: str
    location: str
    address: Optional[str] = None
    price: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[int] = None
    property_type: PropertyTypeEnum
    description: Optional[str] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    brochure_url: Optional[str] = None
    video_url: Optional[str] = None
    builder_name: Optional[str] = None
    possession_date: Optional[datetime] = None
    rera_number: Optional[str] = None


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    price: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[int] = None
    property_type: Optional[PropertyTypeEnum] = None
    description: Optional[str] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    brochure_url: Optional[str] = None
    video_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    builder_name: Optional[str] = None
    possession_date: Optional[datetime] = None
    rera_number: Optional[str] = None


class PropertyResponse(BaseModel):
    id: UUID
    name: str
    location: str
    address: Optional[str] = None
    price: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[int] = None
    property_type: str
    description: Optional[str] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    brochure_url: Optional[str] = None
    video_url: Optional[str] = None
    is_active: bool
    is_featured: bool
    builder_name: Optional[str] = None
    possession_date: Optional[datetime] = None
    rera_number: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PropertyRecommendationResponse(BaseModel):
    id: UUID
    property_id: UUID
    property_name: str
    property_location: str
    price: float
    match_score: int
    reason: Optional[str] = None
    is_viewed: bool
    is_shortlisted: bool
    created_at: datetime

    class Config:
        from_attributes = True


# === Follow-up / Journey Schemas ===
class FollowUpStepCreate(BaseModel):
    channel: ChannelEnum
    message_template: Optional[str] = None
    delay_hours: int = 0
    delay_days: int = 0


class FollowUpStepResponse(BaseModel):
    id: UUID
    sequence_id: UUID
    step_order: int
    channel: str
    message_content: Optional[str] = None
    delay_hours: int
    delay_days: int
    status: str
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FollowUpSequenceResponse(BaseModel):
    id: UUID
    lead_id: UUID
    name: Optional[str] = None
    status: str
    current_step: int
    total_steps: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    stopped_at: Optional[datetime] = None
    stop_reason: Optional[str] = None
    steps: List[FollowUpStepResponse] = []

    class Config:
        from_attributes = True


class JourneyGenerateRequest(BaseModel):
    lead_id: UUID
    channels: Optional[List[ChannelEnum]] = None


class JourneyStep(BaseModel):
    channel: str
    message: str
    delay_days: int
    delay_hours: int


class JourneyResponse(BaseModel):
    sequence: List[JourneyStep]


# === Agent Schemas ===
class LeadQualificationInput(BaseModel):
    message: str
    lead_id: UUID


class LeadQualificationOutput(BaseModel):
    name: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    location: Optional[str] = None
    property_type: Optional[str] = None
    timeline: Optional[str] = None
    financing_required: bool = False
    intent: Optional[str] = None


class LeadScoringOutput(BaseModel):
    score: int
    priority: str
    explanation: str


class PropertyMatch(BaseModel):
    property_id: UUID
    property_name: str
    location: str
    price: float
    match_score: int
    reason: str


class PropertyRecommendationOutput(BaseModel):
    recommendations: List[Any]


# === Analytics Schemas ===
class DashboardStats(BaseModel):
    today_leads: int
    total_leads: int
    active_leads: int = 0
    hot_leads: int
    warm_leads: int
    cold_leads: int
    pending_followups: int = 0
    whatsapp_sent: int = 0
    emails_sent: int = 0
    upcoming_site_visits: int
    completed_visits: int
    bookings: int
    conversion_rate: float
    leads_by_source: List[Any]
    leads_by_stage: List[Any]
    recent_activities: List[Any] = []
    ai_insights: Optional[Dict[str, Any]] = None


class ActivityResponse(BaseModel):
    id: UUID
    lead_id: UUID
    user_id: Optional[UUID] = None
    activity_type: str
    title: str
    description: Optional[str] = None
    metadata: Optional[Any] = Field(default=None, alias="meta_data")
...
class Config:
    from_attributes = True
    populate_by_name = True


class AppointmentCreate(BaseModel):
    lead_id: UUID
    property_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    appointment_type: str = "site_visit"
    scheduled_at: datetime
    duration_minutes: int = 60
    location: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: UUID
    lead_id: UUID
    property_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    appointment_type: str
    status: str
    scheduled_at: datetime
    duration_minutes: int
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
