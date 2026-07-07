from fastapi import APIRouter, HTTPException, Depends, Query, status
from uuid import UUID
from typing import Optional
from app.schemas.schemas import PropertyCreate, PropertyUpdate, PropertyResponse
from app.db.repositories.properties import PropertyRepository
from app.core.auth.dependencies import get_current_user_id

router = APIRouter(prefix="/properties", tags=["Properties"])
property_repo = PropertyRepository()


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    property_data: PropertyCreate,
    user_id: UUID = Depends(get_current_user_id),
):
    prop = await property_repo.create(property_data.model_dump())
    return prop


@router.get("")
async def list_properties(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    property_type: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    search: Optional[str] = None,
    user_id: UUID = Depends(get_current_user_id),
):
    items, total = await property_repo.get_all(
        page=page,
        size=size,
        property_type=property_type,
        location=location,
        min_price=min_price,
        max_price=max_price,
        bedrooms=bedrooms,
        search=search,
    )
    return {"items": items, "total": total, "page": page, "size": size}


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    prop = await property_repo.get_by_id(property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: UUID,
    property_data: PropertyUpdate,
    user_id: UUID = Depends(get_current_user_id),
):
    prop = await property_repo.get_by_id(property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    update_dict = property_data.model_dump(exclude_none=True)
    if update_dict:
        prop = await property_repo.update(property_id, update_dict)
    return prop
