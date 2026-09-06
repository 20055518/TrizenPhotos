from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional
from pathlib import Path
from app.database import get_database
from app.models.photo import PhotoResponse, PhotoSelectionUpdate, BatchDeletePhotos
from app.models.user import UserRole
from app.services.dependencies import get_current_user, require_admin, require_team_or_admin
from app.services.storage import storage_service
from app.config import settings

router = APIRouter(prefix='/api/photos', tags=['Photos'])

def photo_doc_to_response(doc: dict) -> PhotoResponse:
    return PhotoResponse(
        id=str(doc['_id']),
        event_id=doc['event_id'],
        uploaded_by=doc['uploaded_by'],
        uploaded_by_name=doc.get('uploaded_by_name', 'Photographer'),
        filename=doc['filename'],
        original_name=doc['original_name'],
        url=doc['url'],
        thumbnail_url=doc.get('thumbnail_url', doc['url']),
        file_size=doc['file_size'],
        mime_type=doc['mime_type'],
        is_selected_for_gallery=doc.get('is_selected_for_gallery', False),
        created_at=doc['created_at']
    )

@router.post('/upload', response_model=List[PhotoResponse])
async def upload_photos(
    event_id: str = Form(...),
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(require_team_or_admin)
):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail='Invalid event ID.')

    db = get_database()
    event = await db.events.find_one({'_id': ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found.')

    # Permission check: Admin or assigned team member
    if current_user['role'] != UserRole.ADMIN:
        if current_user['id'] not in event.get('assigned_team_ids', []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You are not assigned to this event and cannot upload photos.'
            )

    uploaded_photos = []
    for file in files:
        # Validate mime type
        if not file.content_type.startswith('image/'):
            continue  # Skip non-images
        
        content = await file.read()
        storage_meta = await storage_service.save_file(
            event_id=event_id,
            filename=file.filename or 'photo.jpg',
            content=content,
            mime_type=file.content_type
        )

        photo_doc = {
            'event_id': event_id,
            'uploaded_by': current_user['id'],
            'uploaded_by_name': current_user['name'],
            'filename': storage_meta['filename'],
            'original_name': storage_meta['original_name'],
            'storage_path': storage_meta['storage_path'],
            'url': storage_meta['url'],
            'thumbnail_url': storage_meta['thumbnail_url'],
            'file_size': storage_meta['file_size'],
            'mime_type': storage_meta['mime_type'],
            'is_selected_for_gallery': False,
            'created_at': datetime.now(timezone.utc)
        }
        result = await db.photos.insert_one(photo_doc)
        photo_doc['_id'] = result.inserted_id
        uploaded_photos.append(photo_doc_to_response(photo_doc))

    if not uploaded_photos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='No valid image files were uploaded.'
        )

    return uploaded_photos

@router.get('/event/{event_id}', response_model=List[PhotoResponse])
async def list_event_photos(
    event_id: str,
    selected_only: bool = Query(False),
    current_user: dict = Depends(require_team_or_admin)
):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail='Invalid event ID.')

    db = get_database()
    event = await db.events.find_one({'_id': ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found.')

    query = {'event_id': event_id}
    
    if current_user['role'] == UserRole.ADMIN:
        if selected_only:
            query['is_selected_for_gallery'] = True
    else:
        # Team Member: verify event access
        if current_user['id'] not in event.get('assigned_team_ids', []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You do not have access to view photos for this event.'
            )
        # Team members can only view their own uploaded photos
        query['uploaded_by'] = current_user['id']

    cursor = db.photos.find(query).sort('created_at', -1)
    photos = []
    async for doc in cursor:
        photos.append(photo_doc_to_response(doc))
    return photos

@router.patch('/selection', status_code=status.HTTP_200_OK)
async def update_photo_selection(
    update_in: PhotoSelectionUpdate,
    current_user: dict = Depends(require_admin)
):
    # Only Admin can select photos for publishing
    db = get_database()
    obj_ids = [ObjectId(pid) for pid in update_in.photo_ids if ObjectId.is_valid(pid)]
    if not obj_ids:
        raise HTTPException(status_code=400, detail='No valid photo IDs provided.')

    result = await db.photos.update_many(
        {'_id': {'$in': obj_ids}},
        {'$set': {'is_selected_for_gallery': update_in.is_selected}}
    )
    return {
        'modified_count': result.modified_count,
        'is_selected': update_in.is_selected
    }

@router.delete('/{photo_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: str,
    current_user: dict = Depends(require_team_or_admin)
):
    if not ObjectId.is_valid(photo_id):
        raise HTTPException(status_code=400, detail='Invalid photo ID.')

    db = get_database()
    photo = await db.photos.find_one({'_id': ObjectId(photo_id)})
    if not photo:
        raise HTTPException(status_code=404, detail='Photo not found.')

    # Team member can only delete their own uploaded photos
    if current_user['role'] != UserRole.ADMIN and photo['uploaded_by'] != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='You are not authorized to delete another user\'s photo.'
        )

    storage_service.delete_file(photo['event_id'], photo['filename'])
    await db.photos.delete_one({'_id': ObjectId(photo_id)})
    return None

@router.get('/file/{event_id}/{filename}')
async def stream_photo(event_id: str, filename: str):
    file_path = Path(settings.UPLOAD_DIR) / event_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail='File not found.')
    return FileResponse(file_path)

@router.get('/file/{event_id}/thumbnails/{filename}')
async def stream_thumbnail(event_id: str, filename: str):
    file_path = Path(settings.UPLOAD_DIR) / event_id / 'thumbnails' / filename
    if not file_path.exists():
        # Fallback to original
        file_path = Path(settings.UPLOAD_DIR) / event_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail='Thumbnail not found.')
    return FileResponse(file_path)
