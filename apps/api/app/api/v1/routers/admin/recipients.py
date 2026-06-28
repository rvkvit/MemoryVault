from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser, require_admin
from app.api.v1.schemas.common import PaginatedResponse, PaginationMeta
from app.api.v1.schemas.recipient import RecipientCreate, RecipientOut, RecipientSummary, RecipientUpdate
from app.application.services.recipient import RecipientService
from app.core.database import get_db

router = APIRouter(
    prefix="/admin/recipients",
    tags=["Admin — Recipients"],
    dependencies=[Depends(require_admin)],
)

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "",
    response_model=PaginatedResponse[RecipientSummary],
    summary="List all recipients",
)
async def list_recipients(
    db: DbDep,
    user: AdminUser,
    q: str | None = Query(None, description="Search by name, email, or department"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    service = RecipientService(db)
    recipients = await service.search(query=q, skip=skip, limit=limit)
    total = await service.count()
    return PaginatedResponse(
        data=[RecipientSummary.model_validate(r) for r in recipients],
        pagination=PaginationMeta(has_more=(skip + limit) < total, total=total),
    )


@router.post(
    "",
    response_model=RecipientOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new recipient",
)
async def create_recipient(
    db: DbDep,
    user: AdminUser,
    body: RecipientCreate,
):
    service = RecipientService(db)
    recipient = await service.create(
        email=body.email,
        display_name=body.display_name,
        job_title=body.job_title,
        department=body.department,
        team=body.team,
        manager_email=str(body.manager_email) if body.manager_email else None,
        hire_date=body.hire_date,
        last_day=body.last_day,
        actor_email=user["email"],
    )
    return RecipientOut.model_validate(recipient)


@router.get(
    "/{recipient_id}",
    response_model=RecipientOut,
    summary="Get a recipient by ID",
)
async def get_recipient(
    db: DbDep,
    user: AdminUser,
    recipient_id: str = Path(...),
):
    service = RecipientService(db)
    return RecipientOut.model_validate(await service.get_by_id(recipient_id))


@router.put(
    "/{recipient_id}",
    response_model=RecipientOut,
    summary="Update a recipient",
)
async def update_recipient(
    db: DbDep,
    user: AdminUser,
    body: RecipientUpdate,
    recipient_id: str = Path(...),
):
    service = RecipientService(db)
    updated = await service.update(
        recipient_id=recipient_id,
        actor_email=user["email"],
        **body.model_dump(exclude_none=True),
    )
    return RecipientOut.model_validate(updated)


@router.delete(
    "/{recipient_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a recipient (sets is_active=False)",
)
async def delete_recipient(
    db: DbDep,
    user: AdminUser,
    recipient_id: str = Path(...),
):
    service = RecipientService(db)
    await service.soft_delete(recipient_id=recipient_id, actor_email=user["email"])
