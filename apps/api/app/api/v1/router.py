from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.pages import router as pages_router
from app.api.v1.routers.guestbook import router as guestbook_router
from app.api.v1.routers.invite import router as invite_router
from app.api.v1.routers.memories import router as memories_router
from app.api.v1.routers.visits import router as visits_router
from app.api.v1.routers.admin.recipients import router as admin_recipients_router
from app.api.v1.routers.admin.pages import router as admin_pages_router
from app.api.v1.routers.admin.media import router as admin_media_router
from app.api.v1.routers.admin.analytics import router as admin_analytics_router
from app.api.v1.routers.admin.invitations import router as admin_invitations_router
from app.api.v1.routers.admin.memories import router as admin_memories_router

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router)
v1_router.include_router(pages_router)
v1_router.include_router(guestbook_router)
v1_router.include_router(invite_router)
v1_router.include_router(memories_router)
v1_router.include_router(visits_router)
v1_router.include_router(admin_recipients_router)
v1_router.include_router(admin_pages_router)
v1_router.include_router(admin_media_router)
v1_router.include_router(admin_analytics_router)
v1_router.include_router(admin_invitations_router)
v1_router.include_router(admin_memories_router)
