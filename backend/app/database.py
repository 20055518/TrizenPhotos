from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient
from app.config import settings
import logging

logger = logging.getLogger("uvicorn")


class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db_instance = Database()


async def connect_to_mongo():
    try:
        uri = settings.MONGODB_URI

        # Safe diagnostic information — never print the password/URI
        if not uri:
            raise ValueError("MONGODB_URI is empty")

        if not (
            uri.startswith("mongodb://")
            or uri.startswith("mongodb+srv://")
        ):
            raise ValueError(
                "MONGODB_URI has an invalid scheme. "
                "It must begin with mongodb:// or mongodb+srv://"
            )

        logger.info("MONGODB_URI format check passed")

        db_instance.client = AsyncIOMotorClient(uri)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]

        # Verify the connection
        await db_instance.client.admin.command("ping")

        # Setup indexes
        await db_instance.db.users.create_index("email", unique=True)
        await db_instance.db.events.create_index("assigned_team_ids")
        await db_instance.db.photos.create_index(
            [("event_id", 1), ("is_selected_for_gallery", 1)]
        )
        await db_instance.db.photos.create_index("uploaded_by")
        await db_instance.db.galleries.create_index("slug", unique=True)
        await db_instance.db.galleries.create_index("event_id")

        logger.info(
            f"Connected to MongoDB successfully. "
            f"Database: {settings.DATABASE_NAME}"
        )

    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db


def get_sync_database():
    client = MongoClient(settings.MONGODB_URI)
    return client[settings.DATABASE_NAME]