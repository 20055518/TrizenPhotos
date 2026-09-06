from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PhotoResponse(BaseModel):
    id: str
    event_id: str
    uploaded_by: str
    uploaded_by_name: Optional[str] = None
    filename: str
    original_name: str
    url: str
    thumbnail_url: Optional[str] = None
    file_size: int
    mime_type: str
    is_selected_for_gallery: bool = False
    created_at: datetime

class PhotoSelectionUpdate(BaseModel):
    photo_ids: List[str]
    is_selected: bool

class BatchDeletePhotos(BaseModel):
    photo_ids: List[str]
