from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class EventBase(BaseModel):
    name: str
    date: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None

class EventCreate(EventBase):
    assigned_team_ids: List[str] = []

class EventUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    assigned_team_ids: Optional[List[str]] = None

class TeamMemberInfo(BaseModel):
    id: str
    name: str
    email: str

class GallerySummary(BaseModel):
    id: str
    slug: str
    is_published: bool
    published_at: Optional[datetime] = None
    share_url: str

class EventResponse(EventBase):
    id: str
    created_by: str
    assigned_team_ids: List[str] = []
    assigned_team_members: List[TeamMemberInfo] = []
    total_photos: int = 0
    selected_photos: int = 0
    gallery: Optional[GallerySummary] = None
    created_at: datetime

class AssignTeamMembers(BaseModel):
    team_member_ids: List[str]
