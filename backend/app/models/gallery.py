from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.photo import PhotoResponse

class GalleryPublishRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=10)
    slug: Optional[str] = None

class GalleryVerifyPinRequest(BaseModel):
    pin: str

class GalleryResponse(BaseModel):
    id: str
    event_id: str
    event_name: str
    slug: str
    is_published: bool
    published_at: Optional[datetime] = None
    total_selected_photos: int = 0
    share_url: str

class GalleryAccessResponse(BaseModel):
    gallery_token: str
    slug: str
    event_name: str
    event_date: Optional[str] = None
    event_location: Optional[str] = None
    photos: List[PhotoResponse]
