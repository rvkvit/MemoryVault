from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

DataT = TypeVar("DataT")


class SuccessResponse(BaseModel, Generic[DataT]):
    """Wraps any successful API response."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    data: DataT
    message: str | None = None


class PaginatedResponse(BaseModel, Generic[DataT]):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    data: list[DataT]
    pagination: PaginationMeta


class PaginationMeta(BaseModel):
    next_cursor: str | None = None
    has_more: bool
    total: int | None = None


class ErrorResponse(BaseModel):
    """RFC 9457 Problem Details."""
    type: str
    title: str
    status: int
    detail: str
    instance: str | None = None
    extra: Any | None = None
