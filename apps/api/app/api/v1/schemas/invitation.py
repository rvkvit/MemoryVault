from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class InvitationStatus(BaseModel):
    exists: bool
    is_activated: bool
    expires_at: Optional[datetime]
    created_at: Optional[datetime]
    invite_url: Optional[str]

    # Trusted device info (None if not yet activated)
    device_browser: Optional[str] = None
    device_first_visit: Optional[datetime] = None
    device_last_visit: Optional[datetime] = None
    device_visit_count: Optional[int] = None


class GenerateInvitationResponse(BaseModel):
    invite_url: str
    expires_at: datetime


class AdminLoginRequest(BaseModel):
    email: str
    password: str
