from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_recipients: int
    published_pages: int
    unpublished_pages: int
    total_views: int
    total_visits: int


class RecipientAnalyticsRow(BaseModel):
    id: str
    slug: str
    display_name: str
    email: str
    department: Optional[str]
    last_day: Optional[str]
    is_active: bool
    view_count: int
    is_published: bool
    published_at: Optional[str]
    # Visit-level detail
    total_visits: int
    first_visit: Optional[str]     # ISO datetime
    last_visit: Optional[str]      # ISO datetime
    avg_duration_seconds: Optional[float]


class BrowserStat(BaseModel):
    browser: str
    count: int


class DeviceStat(BaseModel):
    device: str
    count: int


class DailyVisit(BaseModel):
    date: str   # "YYYY-MM-DD"
    visits: int


class ChartData(BaseModel):
    browsers: list[BrowserStat]
    devices: list[DeviceStat]
    daily_visits: list[DailyVisit]  # last 30 days


class AnalyticsResponse(BaseModel):
    stats: DashboardStats
    recipients: list[RecipientAnalyticsRow]
    charts: ChartData
