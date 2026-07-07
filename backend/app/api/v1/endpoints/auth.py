from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from app.schemas.schemas import LoginRequest, RegisterRequest, AuthResponse, UserProfile
from app.core.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.core.config.settings import settings
from app.core.database.session import async_session_maker
from app.models import User
from sqlalchemy import select
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

DEMO_USER = {
    "id": str(uuid.uuid4()),
    "email": "admin@proppilot.ai",
    "password": "admin123",
    "full_name": "Sales Agent",
    "phone": "+919999999999",
    "role": "sales_executive",
}


async def get_local_user(email: str) -> dict | None:
    if email == DEMO_USER["email"]:
        return DEMO_USER
    async with async_session_maker() as session:
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            return {
                "id": str(user.id),
                "email": user.email,
                "password": user.email,
                "full_name": user.full_name or user.email.split("@")[0],
                "phone": user.phone,
                "role": user.role,
            }
    return None


async def create_local_user(email: str, full_name: str | None = None, phone: str | None = None) -> dict:
    user_id = str(uuid.uuid4())
    async with async_session_maker() as session:
        existing = await session.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="User already exists")
        user = User(
            id=user_id,
            email=email,
            full_name=full_name or email.split("@")[0],
            phone=phone,
            role="sales_executive",
        )
        session.add(user)
        await session.commit()
    return {
        "id": user_id,
        "email": email,
        "full_name": full_name or email.split("@")[0],
        "phone": phone,
        "role": "sales_executive",
    }


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    user = await get_local_user(request.email)
    if not user or request.password != user.get("password", ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access_token = create_access_token(data={"sub": user["id"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserProfile(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name"),
            phone=user.get("phone"),
            role=user.get("role", "sales_executive"),
        ),
    )


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    user = await create_local_user(
        email=request.email,
        full_name=request.full_name or request.email.split("@")[0],
        phone=request.phone,
    )

    access_token = create_access_token(data={"sub": user["id"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserProfile(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name"),
            phone=user.get("phone"),
            role=user.get("role", "sales_executive"),
        ),
    )
