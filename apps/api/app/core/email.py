"""
Email service — sends invitation and notification emails via SMTP.

Designed to fail silently: if SMTP is not configured or the send fails,
a warning is logged but the HTTP response is never affected.
"""
from __future__ import annotations

import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings
from app.core.log import get_logger

logger = get_logger(__name__)


def _is_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def _send(to_email: str, subject: str, html: str, plain: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())


async def _send_async(to_email: str, subject: str, html: str, plain: str) -> None:
    try:
        await asyncio.to_thread(_send, to_email, subject, html, plain)
        logger.info("Email sent", extra={"to": to_email, "subject": subject})
    except Exception as exc:
        logger.error("Failed to send email", extra={"to": to_email, "error": str(exc)})


# ── Public helpers ────────────────────────────────────────────────────────────

async def send_invitation_email(
    to_email: str,
    to_name: str,
    invite_url: str,
) -> None:
    if not _is_configured():
        logger.warning("SMTP not configured — skipping invitation email")
        return

    subject = "You're invited — MemoryVault farewell page"
    html = _invitation_html(to_name, invite_url)
    plain = _invitation_plain(to_name, invite_url)
    await _send_async(to_email, subject, html, plain)


async def send_guestbook_notification(
    author_name: str,
    message: str,
    reaction_emoji: str | None,
    page_slug: str,
) -> None:
    if not _is_configured():
        return

    notify_to = settings.NOTIFY_ADMIN_EMAIL or settings.SMTP_USER
    subject = f"{author_name} left a farewell message"
    html = _notification_html(author_name, message, reaction_emoji, page_slug)
    plain = _notification_plain(author_name, message, reaction_emoji, page_slug)
    await _send_async(notify_to, subject, html, plain)


# ── Email templates ───────────────────────────────────────────────────────────

_BASE_STYLE = """
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0c0e16; color: #e8eaf0; margin: 0; padding: 0;
"""

_CARD_STYLE = """
  max-width: 560px; margin: 40px auto; background: #13162a;
  border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);
  padding: 40px 36px; box-sizing: border-box;
"""

_BTN_STYLE = """
  display: inline-block; background: #0078D4; color: #ffffff;
  text-decoration: none; padding: 14px 32px; border-radius: 10px;
  font-size: 15px; font-weight: 600; margin-top: 24px;
"""

_FOOTER_STYLE = "font-size:12px; color:rgba(255,255,255,0.3); margin-top:32px; text-align:center;"


def _invitation_html(name: str, invite_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="{_BASE_STYLE}">
  <div style="{_CARD_STYLE}">
    <h2 style="margin:0 0 8px;font-size:22px;color:#ffffff;">Hi {name},</h2>
    <p style="margin:16px 0;line-height:1.6;color:rgba(255,255,255,0.75);">
      Your colleagues have prepared a farewell page for you on <strong>MemoryVault</strong>.
      Click the button below to view their messages, memories, and wishes.
    </p>
    <p style="margin:0;text-align:center;">
      <a href="{invite_url}" style="{_BTN_STYLE}">View Your Farewell Page</a>
    </p>
    <p style="margin-top:28px;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.5;">
      This link is personal — please don't share it. It expires in
      {settings.INVITATION_TOKEN_EXPIRE_DAYS} days.<br>
      If the button doesn't work, copy this URL:<br>
      <span style="word-break:break-all;">{invite_url}</span>
    </p>
    <p style="{_FOOTER_STYLE}">MemoryVault &middot; Sent by your admin</p>
  </div>
</body>
</html>"""


def _invitation_plain(name: str, invite_url: str) -> str:
    return (
        f"Hi {name},\n\n"
        "Your colleagues have prepared a farewell page for you on MemoryVault.\n"
        "Visit the link below to view their messages and wishes:\n\n"
        f"{invite_url}\n\n"
        f"This link is personal and expires in {settings.INVITATION_TOKEN_EXPIRE_DAYS} days.\n\n"
        "— MemoryVault"
    )


def _notification_html(
    author: str, message: str, emoji: str | None, slug: str
) -> str:
    emoji_line = f"<p style='font-size:28px;margin:0 0 8px;'>{emoji}</p>" if emoji else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="{_BASE_STYLE}">
  <div style="{_CARD_STYLE}">
    <h2 style="margin:0 0 4px;font-size:20px;color:#ffffff;">New farewell message</h2>
    <p style="margin:0 0 20px;color:rgba(255,255,255,0.4);font-size:13px;">
      on page <strong style="color:rgba(255,255,255,0.6);">{slug}</strong>
    </p>
    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:20px 24px;">
      {emoji_line}
      <p style="margin:0;line-height:1.7;color:rgba(255,255,255,0.85);">{message}</p>
    </div>
    <p style="margin-top:16px;font-size:13px;color:rgba(255,255,255,0.4);">
      — {author}
    </p>
    <p style="{_FOOTER_STYLE}">MemoryVault notification</p>
  </div>
</body>
</html>"""


def _notification_plain(
    author: str, message: str, emoji: str | None, slug: str
) -> str:
    emoji_part = f"{emoji} " if emoji else ""
    return (
        f"New farewell message on page '{slug}'\n\n"
        f"{emoji_part}{message}\n\n"
        f"— {author}\n\n"
        "MemoryVault notification"
    )
