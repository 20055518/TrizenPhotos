import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.services.auth_utils import create_access_token
from app.models.user import UserRole

@pytest.fixture(autouse=True)
async def setup_db():
    await connect_to_mongo()
    yield
    await close_mongo_connection()

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://testserver') as ac:
        yield ac

@pytest.fixture
async def admin_token():
    db = get_database()
    admin = await db.users.find_one({'email': 'admin@trizen.com'})
    if not admin:
        raise ValueError('Admin not found. Run seed script first.')
    return create_access_token({'sub': str(admin['_id']), 'role': UserRole.ADMIN.value})

@pytest.fixture
async def team_token():
    db = get_database()
    team = await db.users.find_one({'email': 'photographer@trizen.com'})
    if not team:
        raise ValueError('Team member not found. Run seed script first.')
    return create_access_token({'sub': str(team['_id']), 'role': UserRole.TEAM_MEMBER.value})
