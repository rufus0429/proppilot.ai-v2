from fastapi import APIRouter, HTTPException, Depends, status
from uuid import UUID
from sqlalchemy import select
from app.schemas.schemas import AppointmentCreate, AppointmentResponse
from app.models import Appointment
from app.core.database.session import async_session_maker
from app.core.auth.dependencies import get_current_user_id

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: AppointmentCreate,
    user_id: UUID = Depends(get_current_user_id),
):
    async with async_session_maker() as session:
        appointment = Appointment(
            lead_id=data.lead_id,
            property_id=data.property_id,
            assigned_to=user_id,
            title=data.title,
            description=data.description,
            appointment_type=data.appointment_type,
            scheduled_at=data.scheduled_at,
            duration_minutes=data.duration_minutes,
            location=data.location,
            notes=data.notes,
        )
        session.add(appointment)
        await session.commit()
        await session.refresh(appointment)
        return appointment


@router.get("")
async def list_appointments(
    user_id: UUID = Depends(get_current_user_id),
):
    async with async_session_maker() as session:
        stmt = (
            select(Appointment)
            .order_by(Appointment.scheduled_at.asc())
            .limit(50)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: UUID,
    data: dict,
    user_id: UUID = Depends(get_current_user_id),
):
    async with async_session_maker() as session:
        stmt = select(Appointment).where(Appointment.id == appointment_id)
        result = await session.execute(stmt)
        appointment = result.scalar_one_or_none()
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        for key, value in data.items():
            if hasattr(appointment, key):
                setattr(appointment, key, value)

        await session.commit()
        await session.refresh(appointment)
        return appointment
