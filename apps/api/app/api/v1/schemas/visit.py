from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class VisitStartRequest(BaseModel):
    page_id: str = Field(..., description="UUID of the Page being visited")
    referrer: Optional[str] = Field(None, max_length=2048)


class VisitStartResponse(BaseModel):
    visit_id: str


class VisitPingRequest(BaseModel):
    elapsed_seconds: int = Field(..., ge=0, le=86_400)
