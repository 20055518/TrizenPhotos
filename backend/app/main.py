from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, events, photos, galleries
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Photo Sharing Platform API...")

    await connect_to_mongo()

    yield

    logger.info("Shutting down Photo Sharing Platform API...")

    await close_mongo_connection()


app = FastAPI(
    title="TrizenAI Photo Sharing Platform API",
    description="Full-stack photo-sharing platform for event photography teams with PIN-protected customer galleries.",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(events.router)
app.include_router(photos.router)
app.include_router(galleries.router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "photoshare-api",
        "version": "1.0.0",
    }


@app.get("/api")
async def api_info():
    return {
        "message": "TrizenAI Photo Sharing Platform API",
        "docs": "/docs",
        "status": "active",
    }