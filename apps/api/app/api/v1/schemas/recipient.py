from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RecipientCreate(BaseModel):
    email: EmailStr
    display_name: str = Field(..., min_length=1, max_length=255)
    job_title: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=255)
    team: Optional[str] = Field(None, max_length=255)
    manager_email: Optional[EmailStr] = None
    hire_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    last_day: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class RecipientUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=255)
    job_title: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=255)
    team: Optional[str] = Field(None, max_length=255)
    manager_email: Optional[EmailStr] = None
    hire_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    last_day: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    avatar_blob_url: Optional[str] = Field(None, max_length=2048)


class RecipientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    email: str
    display_name: str
    job_title: Optional[str]
    department: Optional[str]
    team: Optional[str]
    manager_email: Optional[str]
    avatar_blob_url: Optional[str]
    hire_date: Optional[str]
    last_day: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class RecipientSummary(BaseModel):
    """Lightweight projection for list views."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    email: str
    display_name: str
    department: Optional[str]
    last_day: Optional[str]
    is_active: bool
