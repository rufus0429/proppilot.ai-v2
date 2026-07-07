from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from app.core.database.session import async_session_maker
from app.models import Property, PropertyType
from uuid import UUID
from typing import Optional, List


class PropertyRepository:
    async def create(self, data: dict) -> Property:
        async with async_session_maker() as session:
            prop = Property(**data)
            session.add(prop)
            await session.commit()
            await session.refresh(prop)
            return prop

    async def get_by_id(self, property_id: UUID) -> Optional[Property]:
        async with async_session_maker() as session:
            stmt = select(Property).where(Property.id == str(property_id))
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def get_active_properties(self) -> List[Property]:
        async with async_session_maker() as session:
            stmt = select(Property).where(Property.is_active == True)
            result = await session.execute(stmt)
            return list(result.scalars().all())

    async def get_all(
        self,
        page: int = 1,
        size: int = 20,
        property_type: Optional[str] = None,
        location: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        bedrooms: Optional[int] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Property], int]:
        async with async_session_maker() as session:
            conditions = [Property.is_active == True]

            if property_type:
                conditions.append(Property.property_type == property_type)
            if location:
                conditions.append(Property.location.ilike(f"%{location}%"))
            if min_price:
                conditions.append(Property.price >= min_price)
            if max_price:
                conditions.append(Property.price <= max_price)
            if bedrooms:
                conditions.append(Property.bedrooms == bedrooms)
            if search:
                conditions.append(Property.name.ilike(f"%{search}%"))

            from sqlalchemy import and_
            stmt = select(Property).where(and_(*conditions)).order_by(Property.is_featured.desc(), Property.created_at.desc())

            count_stmt = select(func.count()).select_from(Property).where(and_(*conditions))
            count_result = await session.execute(count_stmt)
            total = count_result.scalar() or 0

            offset = (page - 1) * size
            stmt = stmt.offset(offset).limit(size)

            result = await session.execute(stmt)
            items = list(result.scalars().all())
            return items, total

    async def update(self, property_id: UUID, data: dict) -> Optional[Property]:
        async with async_session_maker() as session:
            stmt = (
                update(Property)
                .where(Property.id == str(property_id))
                .values(**data)
                .returning(Property)
            )
            result = await session.execute(stmt)
            await session.commit()
            return result.scalar_one_or_none()
