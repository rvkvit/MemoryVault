from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.api.v1.schemas.recipient import RecipientOut


class MediaAssetAdminOut(BaseModel):
    """Extended MediaAsset projection for admin views — includes storage metadata."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_type: str
    blob_url: str
    cdn_url: Optional[str]
    caption: Optional[str]
    display_order: int
    file_name: Optional[str]
    file_size_bytes: Optional[int]
    mime_type: Optional[str]
    uploaded_by_email: str
    created_at: datetime


class TimelineEventIn(BaseModel):
    event_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    icon: Optional[str] = Field(None, max_length=100)


class TimelineEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_date: str
    title: str
    description: Optional[str]
    icon: Optional[str]
    display_order: int


class MediaAssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_type: str
    cdn_url: Optional[str]
    thumbnail_cdn_url: Optional[str]
    caption: Optional[str]
    display_order: int
    width_px: Optional[int]
    height_px: Optional[int]
    duration_seconds: Optional[int]


class PageUpdate(BaseModel):
    personalized_message: Optional[str] = Field(None, max_length=50_000)
    theme: Optional[str] = Field(None, max_length=50)
    show_guestbook: Optional[bool] = None
    show_timeline: Optional[bool] = None
    show_photos: Optional[bool] = None
    show_video: Optional[bool] = None
    timeline_events: Optional[list[TimelineEventIn]] = Field(None, max_length=50)


class PageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recipient_id: str
    personalized_message: Optional[str]
    theme: str
    show_guestbook: bool
    show_timeline: bool
    show_photos: bool
    show_video: bool
    is_published: bool
    published_at: Optional[datetime]
    view_count: int
    timeline_events: list[TimelineEventOut]
    media_assets: list[MediaAssetOut]


class FarewellPageResponse(BaseModel):
    """The combined payload sent to the recipient's browser — one call, full page."""
    recipient: RecipientOut
    page: PageOut
