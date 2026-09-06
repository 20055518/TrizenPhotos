from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient
from app.config import settings
import logging

logger = logging.getLogger('uvicorn')

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = Database()

async def connect_to_mongo():
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        
        # Setup indexes
        await db_instance.db.users.create_index('email', unique=True)
        await db_instance.db.events.create_index('assigned_team_ids')
        await db_instance.db.photos.create_index([('event_id', 1), ('is_selected_for_gallery', 1)])
        await db_instance.db.photos.create_index('uploaded_by')
        await db_instance.db.galleries.create_index('slug', unique=True)
        await db_instance.db.galleries.create_index('event_id')
        
        logger.info(f'Connected to MongoDB at {settings.MONGODB_URI}, database: {settings.DATABASE_NAME}')
    except Exception as e:
        logger.error(f'Failed to connect to MongoDB: {e}')
        raise e

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info('Closed MongoDB connection')

def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db

def get_sync_database():
    client = MongoClient(settings.MONGODB_URI)
    return client[settings.DATABASE_NAME]
