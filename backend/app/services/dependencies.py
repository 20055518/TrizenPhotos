from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from typing import Optional
from app.database import get_database
from app.services.auth_utils import decode_access_token, decode_gallery_token
from app.models.user import UserRole

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Not authenticated. Please provide Bearer token.',
            headers={'WWW-Authenticate': 'Bearer'}
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or 'sub' not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired authentication token.',
            headers={'WWW-Authenticate': 'Bearer'}
        )
    
    user_id = payload['sub']
    db = get_database()
    try:
        user = await db.users.find_one({'_id': ObjectId(user_id)})
    except Exception:
        user = None

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User belonging to this token no longer exists.'
        )
    
    user['id'] = str(user['_id'])
    return user

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get('role') != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Access forbidden: Admin privilege required.'
        )
    return current_user

async def require_team_or_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get('role') not in (UserRole.ADMIN, UserRole.TEAM_MEMBER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Access forbidden.'
        )
    return current_user

async def verify_gallery_access(
    request: Request,
    x_gallery_token: Optional[str] = Header(None, alias='X-Gallery-Token')
) -> dict:
    # Check header or query parameter
    token = x_gallery_token or request.query_params.get('token')
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Gallery access token missing. Please verify PIN first.'
        )
    payload = decode_gallery_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Invalid or expired gallery session. Please re-enter the PIN.'
        )
    return payload
