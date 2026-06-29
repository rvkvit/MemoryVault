// ── Domain types (mirror FastAPI response schemas) ────────────────────────────

export interface Recipient {
  id: string
  slug: string
  email: string
  display_name: string
  job_title: string | null
  department: string | null
  team: string | null
  manager_email: string | null
  avatar_blob_url: string | null
  hire_date: string | null     // ISO date "YYYY-MM-DD"
  last_day: string | null      // ISO date "YYYY-MM-DD"
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  event_date: string   // "YYYY-MM-DD"
  title: string
  description: string | null
  icon: string | null
  display_order: number
}

export interface MediaAsset {
  id: string
  asset_type: 'photo' | 'video'
  cdn_url: string | null
  thumbnail_cdn_url: string | null
  caption: string | null
  display_order: number
  width_px: number | null
  height_px: number | null
  duration_seconds: number | null
}

export interface Page {
  id: string
  recipient_id: string
  personalized_message: string | null
  theme: string
  show_guestbook: boolean
  show_timeline: boolean
  show_photos: boolean
  show_video: boolean
  is_published: boolean
  published_at: string | null
  view_count: number
  timeline_events: TimelineEvent[]
  media_assets: MediaAsset[]
}

export interface FarewellPageData {
  recipient: Recipient
  page: Page
}

// ── Guestbook ─────────────────────────────────────────────────────────────────

export interface GuestbookEntry {
  id: string
  author_display_name: string
  author_avatar_url: string | null
  message: string
  reaction_emoji: string | null
  created_at: string
}

export interface GuestbookListResponse {
  entries: GuestbookEntry[]
  next_cursor: string | null
  has_more: boolean
  total: number
}

export interface GuestbookEntryCreate {
  message: string
  reaction_emoji?: string | null
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'recipient' | 'admin' | 'colleague'

export interface CurrentUser {
  email: string
  name: string
  role: UserRole
  recipient_id: string | null
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface RecipientSummary {
  id: string
  slug: string
  email: string
  display_name: string
  department: string | null
  last_day: string | null
  is_active: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    next_cursor: string | null
    has_more: boolean
    total: number | null
  }
}

// ── API error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
}

// ── Admin — input shapes (mirror backend schemas) ─────────────────────────────

export interface RecipientCreate {
  email: string
  display_name: string
  job_title?: string | null
  department?: string | null
  team?: string | null
  manager_email?: string | null
  hire_date?: string | null
  last_day?: string | null
}

export interface RecipientUpdate {
  display_name?: string
  job_title?: string | null
  department?: string | null
  team?: string | null
  manager_email?: string | null
  hire_date?: string | null
  last_day?: string | null
  avatar_blob_url?: string | null
}

export interface TimelineEventInput {
  event_date: string   // "YYYY-MM-DD"
  title: string
  description?: string | null
  icon?: string | null
}

export interface PageUpdate {
  personalized_message?: string | null
  show_guestbook?: boolean
  show_timeline?: boolean
  show_photos?: boolean
  show_video?: boolean
  timeline_events?: TimelineEventInput[]
}

// ── Admin — media ─────────────────────────────────────────────────────────────

export interface MediaAssetAdmin {
  id: string
  asset_type: 'photo' | 'video'
  blob_url: string
  cdn_url: string | null
  caption: string | null
  display_order: number
  file_name: string | null
  file_size_bytes: number | null
  mime_type: string | null
  uploaded_by_email: string
  created_at: string
}

// ── Admin — analytics ─────────────────────────────────────────────────────────

export interface DashboardStats {
  total_recipients: number
  published_pages: number
  unpublished_pages: number
  total_views: number
  total_visits: number
}

export interface RecipientAnalyticsRow {
  id: string
  slug: string
  display_name: string
  email: string
  department: string | null
  last_day: string | null
  is_active: boolean
  view_count: number
  is_published: boolean
  published_at: string | null
  // Visit detail
  total_visits: number
  first_visit: string | null
  last_visit: string | null
  avg_duration_seconds: number | null
  // Invitation
  invitation_generation_count: number
  invitation_generated_at: string | null
  invitation_is_activated: boolean
  // Guestbook
  has_guestbook_entry: boolean
}

export interface BrowserStat  { browser: string; count: number }
export interface DeviceStat   { device: string;  count: number }
export interface DailyVisit   { date: string;    visits: number }

export interface ChartData {
  browsers: BrowserStat[]
  devices: DeviceStat[]
  daily_visits: DailyVisit[]
}

export interface AnalyticsResponse {
  stats: DashboardStats
  recipients: RecipientAnalyticsRow[]
  charts: ChartData
}

// ── Visit tracking ────────────────────────────────────────────────────────────

export interface VisitStartRequest  { page_id: string; referrer?: string }
export interface VisitStartResponse { visit_id: string }
export interface VisitPingRequest   { elapsed_seconds: number }

// ── Invitation ────────────────────────────────────────────────────────────────

export interface InvitationStatus {
  exists: boolean
  is_activated: boolean
  expires_at: string | null
  created_at: string | null
  invite_url: string | null
  device_browser: string | null
  device_first_visit: string | null
  device_last_visit: string | null
  device_visit_count: number | null
}

export interface GenerateInvitationResponse {
  invite_url: string
  expires_at: string
}

// ── Memory Vault ──────────────────────────────────────────────────────────────

export interface MemoryEntry {
  id: string
  submitter_name: string
  submitter_email: string | null
  message: string
  voice_url: string | null
  image_url: string | null
  is_favourite: boolean
  created_at: string
}

export interface MemoryListResponse {
  entries: MemoryEntry[]
  total: number
  has_more: boolean
}
