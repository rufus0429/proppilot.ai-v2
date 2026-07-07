from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Text, Boolean, Numeric, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database.session import Base
import uuid
import enum


class LeadSource(str, enum.Enum):
    WEBSITE = "website"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    WHATSAPP = "whatsapp"
    LANDING_PAGE = "landing_page"
    REFERRAL = "referral"
    MANUAL = "manual"
    OTHER = "other"


class LeadStage(str, enum.Enum):
    NEW_LEAD = "new_lead"
    QUALIFIED = "qualified"
    HOT_LEAD = "hot_lead"
    RECOMMENDATION_SENT = "recommendation_sent"
    FOLLOWUP_ACTIVE = "followup_active"
    CUSTOMER_RESPONDED = "customer_responded"
    SITE_VISIT_SCHEDULED = "site_visit_scheduled"
    NEGOTIATION = "negotiation"
    BOOKED = "booked"
    LOST = "lost"


class WorkflowStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class LeadPriority(str, enum.Enum):
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"


class PropertyType(str, enum.Enum):
    APARTMENT = "apartment"
    VILLA = "villa"
    PLOT = "plot"
    COMMERCIAL = "commercial"
    OFFICE = "office"


class FollowUpChannel(str, enum.Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"
    CALL = "call"
    INTERNAL_TASK = "internal_task"


class FollowUpStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    REPLIED = "replied"
    FAILED = "failed"
    SKIPPED = "skipped"


class SequenceStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    STOPPED = "stopped"
    CANCELLED = "cancelled"


class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class ActivityType(str, enum.Enum):
    LEAD_CREATED = "lead_created"
    LEAD_INTAKE_COMPLETED = "lead_intake_completed"
    LEAD_QUALIFIED = "lead_qualified"
    LEAD_SCORED = "lead_scored"
    PROPERTY_RECOMMENDED = "property_recommended"
    FOLLOWUP_SENT = "followup_sent"
    FOLLOWUP_REPLIED = "followup_replied"
    CUSTOMER_RESPONDED = "customer_responded"
    APPOINTMENT_SCHEDULED = "appointment_scheduled"
    APPOINTMENT_COMPLETED = "appointment_completed"
    LEAD_CONVERTED = "lead_converted"
    LEAD_LOST = "lead_lost"
    NOTE_ADDED = "note_added"
    TASK_CREATED = "task_created"
    TASK_COMPLETED = "task_completed"
    WORKFLOW_STARTED = "workflow_started"
    WORKFLOW_COMPLETED = "workflow_completed"
    WORKFLOW_FAILED = "workflow_failed"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    role = Column(String(50), default="sales_executive")
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    supabase_id = Column(String(255), unique=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    leads = relationship("Lead", back_populates="assigned_to_user")
    activities = relationship("Activity", back_populates="user")
    appointments = relationship("Appointment", back_populates="assigned_to_user")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    budget_min = Column(Numeric(12, 2), nullable=True)
    budget_max = Column(Numeric(12, 2), nullable=True)
    location = Column(String(255), nullable=True, index=True)
    preferred_area = Column(String(255), nullable=True)
    property_type = Column(Enum(PropertyType), nullable=True)
    bedrooms = Column(Integer, nullable=True)
    timeline = Column(String(100), nullable=True)
    financing_required = Column(Boolean, default=False)
    intent = Column(Text, nullable=True)
    source = Column(Enum(LeadSource), default=LeadSource.OTHER)
    current_stage = Column(Enum(LeadStage), default=LeadStage.NEW_LEAD, index=True)
    lead_score = Column(Integer, default=0)
    priority = Column(Enum(LeadPriority), default=LeadPriority.COLD)
    workflow_status = Column(Enum(WorkflowStatus), default=WorkflowStatus.PENDING)
    is_duplicate = Column(Boolean, default=False)
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)
    inquiry_data = Column(JSON, default={})
    meta_data = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    qualified_at = Column(DateTime(timezone=True), nullable=True)
    last_contacted_at = Column(DateTime(timezone=True), nullable=True)
    customer_responded_at = Column(DateTime(timezone=True), nullable=True)
    whatsapp_status = Column(String(20), default="pending")
    email_status = Column(String(20), default="pending")
    whatsapp_sent_at = Column(DateTime(timezone=True), nullable=True)
    email_sent_at = Column(DateTime(timezone=True), nullable=True)
    last_followup_at = Column(DateTime(timezone=True), nullable=True)
    followup_retry_count = Column(Integer, default=0)

    assigned_to_user = relationship("User", back_populates="leads")
    properties = relationship("PropertyRecommendation", back_populates="lead")
    sequences = relationship("FollowUpSequence", back_populates="lead")
    appointments = relationship("Appointment", back_populates="lead")
    activities = relationship("Activity", back_populates="lead")
    messages = relationship("Message", back_populates="lead")


class Property(Base):
    __tablename__ = "properties"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=False, index=True)
    address = Column(Text, nullable=True)
    price = Column(Numeric(12, 2), nullable=False)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    area_sqft = Column(Integer, nullable=True)
    property_type = Column(Enum(PropertyType), nullable=False, index=True)
    description = Column(Text, nullable=True)
    amenities = Column(JSON, default=[])
    images = Column(JSON, default=[])
    brochure_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    is_featured = Column(Boolean, default=False)
    builder_name = Column(String(255), nullable=True)
    possession_date = Column(DateTime(timezone=True), nullable=True)
    rera_number = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    recommendations = relationship("PropertyRecommendation", back_populates="property")


class PropertyRecommendation(Base):
    __tablename__ = "property_recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    match_score = Column(Integer, default=0)
    reason = Column(Text, nullable=True)
    is_viewed = Column(Boolean, default=False)
    is_shortlisted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="properties")
    property = relationship("Property", back_populates="recommendations")

    __table_args__ = (
        Index("ix_property_recommendations_lead_property", "lead_id", "property_id", unique=True),
    )


class FollowUpSequence(Base):
    __tablename__ = "followup_sequences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=True)
    status = Column(Enum(SequenceStatus), default=SequenceStatus.ACTIVE, index=True)
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    stopped_at = Column(DateTime(timezone=True), nullable=True)
    stop_reason = Column(String(255), nullable=True)
    meta_data = Column(JSON, default={})

    lead = relationship("Lead", back_populates="sequences")
    steps = relationship("FollowUpStep", back_populates="sequence", order_by="FollowUpStep.step_order")


class FollowUpStep(Base):
    __tablename__ = "followup_steps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sequence_id = Column(String(36), ForeignKey("followup_sequences.id", ondelete="CASCADE"), nullable=False, index=True)
    step_order = Column(Integer, nullable=False)
    channel = Column(Enum(FollowUpChannel), nullable=False)
    message_template = Column(Text, nullable=True)
    message_content = Column(Text, nullable=True)
    delay_hours = Column(Integer, default=0)
    delay_days = Column(Integer, default=0)
    status = Column(Enum(FollowUpStatus), default=FollowUpStatus.PENDING, index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    replied_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    external_id = Column(String(255), nullable=True)
    meta_data = Column(JSON, default={})

    sequence = relationship("FollowUpSequence", back_populates="steps")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    appointment_type = Column(String(50), default="site_visit")
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes = Column(Integer, default=60)
    location = Column(String(500), nullable=True)
    meeting_link = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    lead = relationship("Lead", back_populates="appointments")
    property = relationship("Property")
    assigned_to_user = relationship("User", back_populates="appointments")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    activity_type = Column(Enum(ActivityType), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    meta_data = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    lead = relationship("Lead", back_populates="activities")
    user = relationship("User", back_populates="activities")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(Enum(FollowUpChannel), nullable=False)
    direction = Column(String(20), default="outbound")
    content = Column(Text, nullable=False)
    template_id = Column(String(255), nullable=True)
    status = Column(Enum(FollowUpStatus), default=FollowUpStatus.PENDING, index=True)
    external_id = Column(String(255), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    replied_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    meta_data = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    lead = relationship("Lead", back_populates="messages")
