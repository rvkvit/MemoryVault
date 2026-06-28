from enum import StrEnum


class UserRole(StrEnum):
    RECIPIENT = "recipient"
    ADMIN = "admin"
    COLLEAGUE = "colleague"


class AssetType(StrEnum):
    PHOTO = "photo"
    VIDEO = "video"


class DeliveryStatus(StrEnum):
    PENDING = "pending"
    DELIVERED = "delivered"
    BOUNCED = "bounced"
    FAILED = "failed"


class AuditEventType(StrEnum):
    RECIPIENT_CREATED = "recipient.created"
    RECIPIENT_UPDATED = "recipient.updated"
    RECIPIENT_DELETED = "recipient.deleted"
    PAGE_CREATED = "page.created"
    PAGE_UPDATED = "page.updated"
    PAGE_PUBLISHED = "page.published"
    PAGE_UNPUBLISHED = "page.unpublished"
    GUESTBOOK_ENTRY_CREATED = "guestbook.entry.created"
    GUESTBOOK_ENTRY_HIDDEN = "guestbook.entry.hidden"
    EMAIL_SENT = "email.sent"
    ACCESS_GRANTED = "access.granted"
    ACCESS_DENIED = "access.denied"
