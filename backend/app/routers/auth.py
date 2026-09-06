from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime, timezone
from app.database import get_database
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserRole
from app.services.auth_utils import hash_password, verify_password, create_access_token
from app.services.dependencies import get_current_user, require_admin
from typing import List

router = APIRouter(prefix='/api/auth', tags=['Authentication'])

@router.post('/register', response_model=TokenResponse)
async def register(user_in: UserCreate):
    db = get_database()
    existing = await db.users.find_one({'email': user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Email address is already registered.'
        )

    user_doc = {
        'name': user_in.name,
        'email': user_in.email.lower(),
        'password_hash': hash_password(user_in.password),
        'role': user_in.role.value,
        'created_at': datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token(data={'sub': user_id, 'role': user_in.role.value})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user_in.name,
            email=user_in.email.lower(),
            role=user_in.role,
            created_at=user_doc['created_at']
        )
    )

@router.post('/login', response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_database()
    user = await db.users.find_one({'email': credentials.email.lower()})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid email or password.'
        )

    user_id = str(user['_id'])
    token = create_access_token(data={'sub': user_id, 'role': user['role']})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user['name'],
            email=user['email'],
            role=UserRole(user['role']),
            created_at=user['created_at']
        )
    )

@router.get('/me', response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user['id'],
        name=current_user['name'],
        email=current_user['email'],
        role=UserRole(current_user['role']),
        created_at=current_user['created_at']
    )

@router.get('/team-members', response_model=List[UserResponse])
async def list_team_members(admin_user: dict = Depends(require_admin)):
    db = get_database()
    cursor = db.users.find({'role': UserRole.TEAM_MEMBER.value})
    team_members = []
    async for u in cursor:
        team_members.append(UserResponse(
            id=str(u['_id']),
            name=u['name'],
            email=u['email'],
            role=UserRole(u['role']),
            created_at=u['created_at']
        ))
    return team_members
