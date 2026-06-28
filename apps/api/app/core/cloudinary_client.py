"""Async wrapper around the synchronous Cloudinary SDK.

The Cloudinary Python SDK is synchronous. All calls here are run in a thread
pool via asyncio.to_thread so they never block the event loop.

Configuration is applied once at module import time from app settings.
"""
from __future__ import annotations

import asyncio
from typing import Any

import cloudinary
import cloudinary.uploader

from app.core.config import settings


def _configure() -> None:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


_configure()


async def upload(
    data: bytes,
    *,
    folder: str,
    resource_type: str = "auto",
    **kwargs: Any,
) -> dict[str, Any]:
    """Upload raw bytes to Cloudinary and return the API response dict.

    Useful keys in the returned dict:
      public_id   — store this to delete the asset later
      secure_url  — the https CDN URL to serve to users
      resource_type — "image" | "video" | "raw"
      bytes       — file size
      duration    — seconds (video/audio only)
    """
    return await asyncio.to_thread(
        cloudinary.uploader.upload,
        data,
        folder=folder,
        resource_type=resource_type,
        **kwargs,
    )


async def destroy(public_id: str, *, resource_type: str = "image") -> None:
    """Delete a Cloudinary asset by its public_id."""
    await asyncio.to_thread(
        cloudinary.uploader.destroy,
        public_id,
        resource_type=resource_type,
    )
