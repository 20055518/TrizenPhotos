from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional
from app.database import get_database
from app.models.event import (
    EventCreate, EventUpdate, EventResponse, AssignTeamMembers, 
    TeamMemberInfo, GallerySummary
)
from app.models.user import UserRole
from app.services.dependencies import get_current_user, require_admin, require_team_or_admin

router = APIRouter(prefix='/api/events', tags=['Events'])

async def build_event_response(event_doc: dict, db) -> EventResponse:
    event_id_str = str(event_doc['_id'])
    
    # Fetch team member info
    assigned_ids = event_doc.get('assigned_team_ids', [])
    team_members = []
    if assigned_ids:
        obj_ids = [ObjectId(uid) for uid in assigned_ids if ObjectId.is_valid(uid)]
        cursor = db.users.find({'_id': {'': obj_ids}})
        async for tm in cursor:
            team_members.append(TeamMemberInfo(
                id=str(tm['_id']),
                name=tm['name'],
                email=tm['email']
            ))

    # Calculate photo counts
    total_photos = await db.photos.count_documents({'event_id': event_id_str})
    selected_photos = await db.photos.count_documents({
        'event_id': event_id_str,
        'is_selected_for_gallery': True
    })

    # Gallery info
    gallery_doc = await db.galleries.find_one({'event_id': event_id_str})
    gallery_info = None
    if gallery_doc:
        gallery_slug = gallery_doc.get('slug', '')
        gallery_info = GallerySummary(
            id=str(gallery_doc['_id']),
            slug=gallery_slug,
            is_published=gallery_doc.get('is_published', False),
            published_at=gallery_doc.get('published_at'),
            share_url=f'/gallery/{gallery_slug}'
        )

    return EventResponse(
        id=event_id_str,
        name=event_doc['name'],
        date=event_doc.get('date'),
        location=event_doc.get('location'),
        description=event_doc.get('description'),
        created_by=str(event_doc.get('created_by', '')),
        assigned_team_ids=assigned_ids,
        assigned_team_members=team_members,
        total_photos=total_photos,
        selected_photos=selected_photos,
        gallery=gallery_info,
        created_at=event_doc['created_at']
    )

@router.get('', response_model=List[EventResponse])
async def list_events(current_user: dict = Depends(require_team_or_admin)):
    db = get_database()
    user_id = current_user['id']
    role = current_user['role']

    if role == UserRole.ADMIN:
        cursor = db.events.find().sort('created_at', -1)
    else:
        cursor = db.events.find({'assigned_team_ids': user_id}).sort('created_at', -1)

    events = []
    async for event in cursor:
        events.append(await build_event_response(event, db))
    return events

@router.post('', response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    current_user: dict = Depends(require_admin)
):
    db = get_database()
    event_doc = {
        'name': event_in.name,
        'date': event_in.date,
        'location': event_in.location,
        'description': event_in.description,
        'created_by': current_user['id'],
        'assigned_team_ids': event_in.assigned_team_ids,
        'created_at': datetime.now(timezone.utc)
    }
    result = await db.events.insert_one(event_doc)
    event_doc['_id'] = result.inserted_id
    return await build_event_response(event_doc, db)

@router.get('/{event_id}', response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: dict = Depends(require_team_or_admin)
):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail='Invalid event ID format.')

    db = get_database()
    event = await db.events.find_one({'_id': ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found.')

    if current_user['role'] != UserRole.ADMIN:
        if current_user['id'] not in event.get('assigned_team_ids', []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You are not authorized to access this event.'
            )

    return await build_event_response(event, db)

@router.put('/{event_id}', response_model=EventResponse)
async def update_event(
    event_id: str,
    event_in: EventUpdate,
    current_user: dict = Depends(require_admin)
):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail='Invalid event ID format.')

    db = get_database()
    update_data = {k: v for k, v in event_in.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail='No update fields provided.')

    result = await db.events.find_one_and_update(
        {'_id': ObjectId(event_id)},
        {'': update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail='Event not found.')

    return await build_event_response(result, db)

@router.post('/{event_id}/assign-team', response_model=EventResponse)
async def assign_team_members(
    event_id: str,
    assign_in: AssignTeamMembers,
    current_user: dict = Depends(require_admin)
):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail='Invalid event ID format.')

    db = get_database()
    result = await db.events.find_one_and_update(
        {'_id': ObjectId(event_id)},
        {'': {'assigned_team_ids': assign_in.team_member_ids}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail='Event not found.')

    return await build_event_response(result, db)

@router.delete('/{event_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    current_user: dict = Depends(require_admin)
):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail='Invalid event ID format.')

    db = get_database()
    event = await db.events.find_one({'_id': ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found.')

    await db.photos.delete_many({'event_id': event_id})
    await db.galleries.delete_many({'event_id': event_id})
    await db.events.delete_one({'_id': ObjectId(event_id)})
    return None
