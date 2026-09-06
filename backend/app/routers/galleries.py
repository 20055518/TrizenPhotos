from fastapi import APIRouter, HTTPException, status, Depends, Query, Response
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime, timezone
import secrets
import string
import io
import zipfile
from pathlib import Path
from typing import List, Optional

from app.database import get_database
from app.models.gallery import (
    GalleryPublishRequest, GalleryVerifyPinRequest, GalleryResponse, GalleryAccessResponse
)
from app.models.photo import PhotoResponse
from app.models.user import UserRole
from app.services.dependencies import get_current_user, require_admin, verify_gallery_access
from app.services.auth_utils import hash_password, verify_password, create_gallery_token
from app.routers.photos import photo_doc_to_response
from app.config import settings

router = APIRouter(prefix='/api/galleries', tags=['Galleries'])

def generate_random_slug(length: int = 6) -> str:
    chars = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

@router.post('/publish/{event_id}', response_model=GalleryResponse)
async def publish_gallery(
    event_id: str,
    publish_in: GalleryPublishRequest,
    current_user: dict = Depends(require_admin)
):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail='Invalid event ID.')

    db = get_database()
    event = await db.events.find_one({'_id': ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found.')

    selected_count = await db.photos.count_documents({
        'event_id': event_id,
        'is_selected_for_gallery': True
    })

    slug = (publish_in.slug or '').strip().lower()
    if not slug:
        existing = await db.galleries.find_one({'event_id': event_id})
        if existing and existing.get('slug'):
            slug = existing['slug']
        else:
            slug = generate_random_slug(6)

    collision = await db.galleries.find_one({'slug': slug, 'event_id': {'': event_id}})
    if collision:
        slug = f'{slug}-{generate_random_slug(3)}'

    hashed_pin = hash_password(publish_in.pin)
    now = datetime.now(timezone.utc)

    gallery_doc = await db.galleries.find_one_and_update(
        {'event_id': event_id},
        {
            '': {
                'event_id': event_id,
                'slug': slug,
                'pin_hash': hashed_pin,
                'is_published': True,
                'published_at': now,
                'updated_at': now
            }
        },
        upsert=True,
        return_document=True
    )

    return GalleryResponse(
        id=str(gallery_doc['_id']),
        event_id=event_id,
        event_name=event['name'],
        slug=slug,
        is_published=True,
        published_at=now,
        total_selected_photos=selected_count,
        share_url=f'/gallery/{slug}'
    )

@router.get('/event/{event_id}')
async def get_gallery_for_event(
    event_id: str,
    current_user: dict = Depends(require_admin)
):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail='Invalid event ID.')

    db = get_database()
    gallery = await db.galleries.find_one({'event_id': event_id})
    if not gallery:
        return {'is_published': False, 'gallery': None}

    selected_count = await db.photos.count_documents({
        'event_id': event_id,
        'is_selected_for_gallery': True
    })

    slug_val = gallery.get('slug', '')
    return {
        'is_published': gallery.get('is_published', False),
        'gallery': {
            'id': str(gallery['_id']),
            'slug': slug_val,
            'published_at': gallery.get('published_at'),
            'total_selected_photos': selected_count,
            'share_url': f'/gallery/{slug_val}'
        }
    }

@router.get('/public/{slug}/info')
async def get_public_gallery_info(slug: str):
    db = get_database()
    gallery = await db.galleries.find_one({'slug': slug})
    if not gallery or not gallery.get('is_published', False):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Gallery not found or is currently unpublished.'
        )

    event = await db.events.find_one({'_id': ObjectId(gallery['event_id'])})
    if not event:
        raise HTTPException(status_code=404, detail='Event associated with this gallery no longer exists.')

    total_photos = await db.photos.count_documents({
        'event_id': gallery['event_id'],
        'is_selected_for_gallery': True
    })

    return {
        'slug': gallery['slug'],
        'event_name': event['name'],
        'event_date': event.get('date'),
        'event_location': event.get('location'),
        'event_description': event.get('description'),
        'total_photos': total_photos,
        'requires_pin': True
    }

@router.post('/public/{slug}/verify', response_model=GalleryAccessResponse)
async def verify_gallery_pin(slug: str, verify_in: GalleryVerifyPinRequest):
    db = get_database()
    gallery = await db.galleries.find_one({'slug': slug})
    if not gallery or not gallery.get('is_published', False):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Gallery not found or unpublished.'
        )

    if not verify_password(verify_in.pin, gallery['pin_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Incorrect PIN. Please verify the code and try again.'
        )

    event_id = gallery['event_id']
    event = await db.events.find_one({'_id': ObjectId(event_id)})
    
    token = create_gallery_token(slug=slug, event_id=event_id)

    cursor = db.photos.find({
        'event_id': event_id,
        'is_selected_for_gallery': True
    }).sort('created_at', -1)

    photos = []
    async for p in cursor:
        photos.append(photo_doc_to_response(p))

    return GalleryAccessResponse(
        gallery_token=token,
        slug=slug,
        event_name=event['name'] if event else 'Event Gallery',
        event_date=event.get('date') if event else None,
        event_location=event.get('location') if event else None,
        photos=photos
    )

@router.get('/public/{slug}/photos', response_model=List[PhotoResponse])
async def get_gallery_photos(
    slug: str,
    gallery_session: dict = Depends(verify_gallery_access)
):
    if gallery_session.get('slug') != slug:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Access token does not match this gallery.'
        )

    db = get_database()
    cursor = db.photos.find({
        'event_id': gallery_session['event_id'],
        'is_selected_for_gallery': True
    }).sort('created_at', -1)

    photos = []
    async for p in cursor:
        photos.append(photo_doc_to_response(p))
    return photos

@router.get('/public/{slug}/download-zip')
async def download_gallery_zip(
    slug: str,
    token: Optional[str] = Query(None)
):
    if not token:
        raise HTTPException(status_code=401, detail='Access token required for download.')

    from app.services.auth_utils import decode_gallery_token
    payload = decode_gallery_token(token)
    if not payload or payload.get('slug') != slug:
        raise HTTPException(status_code=403, detail='Invalid or expired download token.')

    db = get_database()
    event_id = payload['event_id']
    cursor = db.photos.find({
        'event_id': event_id,
        'is_selected_for_gallery': True
    })

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        async for p in cursor:
            file_path = Path(p['storage_path'])
            if file_path.exists():
                zf.write(file_path, arcname=p['original_name'])

    zip_buffer.seek(0)
    filename = f'{slug}_gallery_photos.zip'
    return StreamingResponse(
        zip_buffer,
        media_type='application/zip',
        headers={'Content-Disposition': 'attachment; filename=' + filename}
    )
