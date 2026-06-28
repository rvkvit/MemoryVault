from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MemoryCreate(BaseModel):
    submitter_name: str = Field(..., min_length=1, max_length=255)
    submitter_email: Optional[str] = Field(None, max_length=320)
    message: str = Field(..., min_length=1, max_length=5000)


class MemoryOut(BaseModel):
    id: str
    submitter_name: str
    submitter_email: Optional[str]
    message: str
    voice_url: Optional[str]
    image_url: Optional[str]
    is_favourite: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MemoryListResponse(BaseModel):
    entries: list[MemoryOut]
    total: int
    has_more: bool
