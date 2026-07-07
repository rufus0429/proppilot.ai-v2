from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from app.core.config.settings import settings
from app.api.v1.endpoints import auth, leads, properties, appointments
from app.core.database.session import init_db, close_db
import logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("Starting PropPilot AI backend...")
    await init_db()
    yield
    await close_db()
    logging.info("Shutting down PropPilot AI backend...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Authentication", "description": "Auth endpoints"},
        {"name": "Leads", "description": "Lead management endpoints"},
        {"name": "Properties", "description": "Property management endpoints"},
        {"name": "Appointments", "description": "Appointment/site visit endpoints"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(leads.router, prefix=settings.api_v1_prefix)
app.include_router(properties.router, prefix=settings.api_v1_prefix)
app.include_router(appointments.router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
