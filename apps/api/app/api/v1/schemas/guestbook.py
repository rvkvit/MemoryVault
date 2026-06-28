from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GuestbookEntryCreate(BaseModel):
    message: str = Field(..., min_length=10, max_length=2000)
    reaction_emoji: Optional[str] = Field(None, max_length=10)


class GuestbookEntryOut(BaseModel):
    """Author email is deliberately excluded from API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    author_display_name: str
    author_avatar_url: Optional[str]
    message: str
    reaction_emoji: Optional[str]
    created_at: datetime


class GuestbookListResponse(BaseModel):
    entries: list[GuestbookEntryOut]
    next_cursor: Optional[str]
    has_more: bool
    total: int
