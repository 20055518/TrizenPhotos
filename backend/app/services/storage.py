import os
import uuid
import aiofiles
from pathlib import Path
from PIL import Image
import io
from app.config import settings
import logging

logger = logging.getLogger('uvicorn')

class LocalStorageProvider:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_file(self, event_id: str, filename: str, content: bytes, mime_type: str) -> dict:
        event_dir = self.base_dir / str(event_id)
        thumb_dir = event_dir / 'thumbnails'
        os.makedirs(event_dir, exist_ok=True)
        os.makedirs(thumb_dir, exist_ok=True)

        ext = Path(filename).suffix.lower()
        if not ext:
            ext = '.jpg'
        unique_name = f'{uuid.uuid4().hex}{ext}'
        file_path = event_dir / unique_name
        thumb_path = thumb_dir / unique_name

        # Save original file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)

        # Generate thumbnail using Pillow if it is an image
        has_thumbnail = False
        try:
            image = Image.open(io.BytesIO(content))
            image.thumbnail((400, 400), Image.Resampling.LANCZOS)
            if image.mode in ('RGBA', 'P') and ext in ('.jpg', '.jpeg'):
                image = image.convert('RGB')
            image.save(thumb_path, quality=85, optimize=True)
            has_thumbnail = True
        except Exception as e:
            logger.warning(f'Could not generate thumbnail for {filename}: {e}')

        return {
            'filename': unique_name,
            'original_name': filename,
            'storage_path': str(file_path),
            'url': f'/api/photos/file/{event_id}/{unique_name}',
            'thumbnail_url': f'/api/photos/file/{event_id}/thumbnails/{unique_name}' if has_thumbnail else f'/api/photos/file/{event_id}/{unique_name}',
            'file_size': len(content),
            'mime_type': mime_type
        }

    def delete_file(self, event_id: str, filename: str):
        event_dir = self.base_dir / str(event_id)
        file_path = event_dir / filename
        thumb_path = event_dir / 'thumbnails' / filename
        if file_path.exists():
            file_path.unlink()
        if thumb_path.exists():
            thumb_path.unlink()

def get_storage_service():
    return LocalStorageProvider(settings.UPLOAD_DIR)

storage_service = get_storage_service()
