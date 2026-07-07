from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database.session import async_session_maker
from app.models import Lead, LeadStage, LeadPriority, Activity, ActivityType, FollowUpSequence, SequenceStatus, Appointment, AppointmentStatus, Message, FollowUpChannel, FollowUpStatus
from uuid import UUID
from datetime import datetime, date, timedelta
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class LeadRepository:
    async def create(self, data: dict) -> Lead:
        async with async_session_maker() as session:
            lead = Lead(**data)
            session.add(lead)
            await session.commit()
            await session.refresh(lead)
            return lead

    async def get_by_id(self, lead_id: UUID) -> Optional[Lead]:
        async with async_session_maker() as session:
            stmt = (
                select(Lead)
                .options(selectinload(Lead.assigned_to_user))
                .where(Lead.id == str(lead_id))
            )
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def get_all(
        self,
        page: int = 1,
        size: int = 20,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        source: Optional[str] = None,
        sort_by: str = "created_at",
        sort_desc: bool = True,
    ) -> tuple[List[Lead], int]:
        async with async_session_maker() as session:
            conditions = []

            if status:
                conditions.append(Lead.current_stage == status)

            if priority:
                conditions.append(Lead.priority == priority)

            if source:
                conditions.append(Lead.source == source)

            if search:
                search_filter = or_(
                    Lead.name.ilike(f"%{search}%"),
                    Lead.phone.ilike(f"%{search}%"),
                    Lead.email.ilike(f"%{search}%"),
                    Lead.location.ilike(f"%{search}%"),
                )
                conditions.append(search_filter)

            stmt = select(Lead).options(selectinload(Lead.assigned_to_user))

            if conditions:
                stmt = stmt.where(and_(*conditions))

            count_stmt = select(func.count()).select_from(Lead)
            if conditions:
                count_stmt = count_stmt.where(and_(*conditions))

            count_result = await session.execute(count_stmt)
            total = count_result.scalar() or 0

            sort_column = getattr(Lead, sort_by, Lead.created_at)
            if sort_desc:
                stmt = stmt.order_by(sort_column.desc())
            else:
                stmt = stmt.order_by(sort_column.asc())

            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            result = await session.execute(stmt)
            items = list(result.scalars().all())

            return items, total

    async def update(self, lead_id: UUID, data: dict) -> Optional[Lead]:
        async with async_session_maker() as session:
            stmt = (
                update(Lead)
                .where(Lead.id == str(lead_id))
                .values(**data)
                .returning(Lead)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar_one_or_none()

    async def find_by_phone_or_email(self, phone: str, email: Optional[str] = None) -> Optional[Lead]:
        async with async_session_maker() as session:
            conditions = [Lead.phone == phone]
            if email:
                conditions.append(Lead.email == email)
            stmt = select(Lead).where(or_(*conditions)).limit(1)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def get_recent_activities(self, limit: int = 10) -> list:
        async with async_session_maker() as session:
            stmt = (
                select(Activity)
                .options(selectinload(Activity.lead), selectinload(Activity.user))
                .order_by(Activity.created_at.desc())
                .limit(limit)
            )
            result = await session.execute(stmt)
            return list(result.scalars().all())

    async def get_dashboard_stats(self) -> dict:
        async with async_session_maker() as session:
            today = date.today()
            today_start = datetime.combine(today, datetime.min.time())
            today_end = datetime.combine(today, datetime.max.time())

            total_stmt = select(func.count()).select_from(Lead)
            total = (await session.execute(total_stmt)).scalar() or 0

            today_stmt = select(func.count()).select_from(Lead).where(
                Lead.created_at.between(today_start, today_end)
            )
            today_leads = (await session.execute(today_stmt)).scalar() or 0

            hot_stmt = select(func.count()).select_from(Lead).where(
                Lead.priority == LeadPriority.HOT
            )
            hot_leads = (await session.execute(hot_stmt)).scalar() or 0

            warm_stmt = select(func.count()).select_from(Lead).where(
                Lead.priority == LeadPriority.WARM
            )
            warm_leads = (await session.execute(warm_stmt)).scalar() or 0

            cold_stmt = select(func.count()).select_from(Lead).where(
                Lead.priority == LeadPriority.COLD
            )
            cold_leads = (await session.execute(cold_stmt)).scalar() or 0

            booked_stmt = select(func.count()).select_from(Lead).where(
                Lead.current_stage == LeadStage.BOOKED
            )
            bookings = (await session.execute(booked_stmt)).scalar() or 0

            site_visit_stmt = select(func.count()).select_from(Appointment).where(
                Appointment.status == AppointmentStatus.SCHEDULED
            )
            scheduled_site_visits = (await session.execute(site_visit_stmt)).scalar() or 0

            new_leads_stmt = select(func.count()).select_from(Lead).where(
                Lead.current_stage == LeadStage.NEW_LEAD
            )
            new_leads = (await session.execute(new_leads_stmt)).scalar() or 0

            qualified_leads_stmt = select(func.count()).select_from(Lead).where(
                Lead.current_stage == LeadStage.QUALIFIED
            )
            qualified_leads = (await session.execute(qualified_leads_stmt)).scalar() or 0

            active_leads_stmt = select(func.count()).select_from(Lead).where(
                Lead.current_stage.notin_([LeadStage.LOST, LeadStage.BOOKED])
            )
            active_leads = (await session.execute(active_leads_stmt)).scalar() or 0

            whatsapp_sent_stmt = select(func.count()).select_from(Activity).where(
                Activity.activity_type == ActivityType.FOLLOWUP_SENT,
            )
            whatsapp_sent = (await session.execute(whatsapp_sent_stmt)).scalar() or 0

            emails_sent_stmt = select(func.count()).select_from(Message).where(
                and_(Message.channel == FollowUpChannel.EMAIL, Message.status == FollowUpStatus.SENT)
            )
            emails_sent = (await session.execute(emails_sent_stmt)).scalar() or 0

            pending_followups_stmt = select(func.count()).select_from(FollowUpSequence).where(
                FollowUpSequence.status == SequenceStatus.ACTIVE
            )
            pending_followups = (await session.execute(pending_followups_stmt)).scalar() or 0

            conversion_rate = round((bookings / total * 100), 2) if total > 0 else 0

            source_stmt = select(
                Lead.source, func.count().label("count")
            ).group_by(Lead.source)
            source_result = await session.execute(source_stmt)
            leads_by_source = [{"source": row.source, "count": row.count} for row in source_result]

            stage_stmt = select(
                Lead.current_stage, func.count().label("count")
            ).group_by(Lead.current_stage)
            stage_result = await session.execute(stage_stmt)
            leads_by_stage = []
            for row in stage_result:
                stage_val = row.current_stage
                if hasattr(stage_val, 'value'):
                    stage_str = stage_val.value
                else:
                    stage_str = str(stage_val)
                leads_by_stage.append({"stage": stage_str, "count": row.count})

            recent_stmt = (
                select(Activity)
                .options(selectinload(Activity.lead))
                .order_by(Activity.created_at.desc())
                .limit(10)
            )
            recent_result = await session.execute(recent_stmt)
            recent_activities = [
                {
                    "id": str(a.id),
                    "lead_id": str(a.lead_id),
                    "lead_name": a.lead.name if a.lead else None,
                    "activity_type": a.activity_type.value if hasattr(a.activity_type, 'value') else str(a.activity_type),
                    "title": a.title,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in recent_result.scalars().all()
            ]

            ai_insights = {
                "total_leads_today": today_leads,
                "hot_leads_pending": hot_leads,
                "pending_followups": pending_followups,
                "upcoming_visits": scheduled_site_visits,
            }

            return {
                "active_leads": active_leads,
                "today_leads": today_leads,
                "total_leads": total,
                "new_leads": new_leads,
                "qualified_leads": qualified_leads,
                "hot_leads": hot_leads,
                "warm_leads": warm_leads,
                "cold_leads": cold_leads,
                "whatsapp_sent": whatsapp_sent,
                "emails_sent": emails_sent,
                "pending_followups": pending_followups,
                "upcoming_site_visits": scheduled_site_visits,
                "completed_visits": 0,
                "bookings": bookings,
                "conversion_rate": conversion_rate,
                "leads_by_source": leads_by_source,
                "leads_by_stage": leads_by_stage,
                "recent_activities": recent_activities,
                "ai_insights": ai_insights,
            }
