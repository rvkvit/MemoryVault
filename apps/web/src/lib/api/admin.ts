/**
 * Admin API — all admin HTTP calls in one place.
 *
 * Every function uses the shared `apiClient` (Axios with credentials) so the
 * auth cookie is sent automatically. No duplicate client configuration here.
 */

import { apiClient } from './client'
import type {
  AnalyticsResponse,
  GenerateInvitationResponse,
  InvitationStatus,
  MediaAssetAdmin,
  MemoryEntry,
  MemoryListResponse,
  Page,
  PageUpdate,
  PaginatedResponse,
  Recipient,
  RecipientCreate,
  RecipientSummary,
  RecipientUpdate,
} from '@/types/farewell'

// ── Recipients ────────────────────────────────────────────────────────────────

export async function listRecipients(params?: {
  q?: string
  skip?: number
  limit?: number
}): Promise<PaginatedResponse<RecipientSummary>> {
  const { data } = await apiClient.get<PaginatedResponse<RecipientSummary>>(
    '/api/v1/admin/recipients',
    { params },
  )
  return data
}

export async function getRecipient(id: string): Promise<Recipient> {
  const { data } = await apiClient.get<Recipient>(`/api/v1/admin/recipients/${id}`)
  return data
}

export async function createRecipient(body: RecipientCreate): Promise<Recipient> {
  const { data } = await apiClient.post<Recipient>('/api/v1/admin/recipients', body)
  return data
}

export async function updateRecipient(id: string, body: RecipientUpdate): Promise<Recipient> {
  const { data } = await apiClient.put<Recipient>(`/api/v1/admin/recipients/${id}`, body)
  return data
}

export async function deleteRecipient(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/recipients/${id}`)
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function getAdminPage(recipientId: string): Promise<Page> {
  const { data } = await apiClient.get<Page>(`/api/v1/admin/pages/${recipientId}`)
  return data
}

export async function upsertPage(recipientId: string, body: PageUpdate): Promise<Page> {
  const { data } = await apiClient.put<Page>(`/api/v1/admin/pages/${recipientId}`, body)
  return data
}

export async function publishPage(recipientId: string): Promise<Page> {
  const { data } = await apiClient.post<Page>(`/api/v1/admin/pages/${recipientId}/publish`)
  return data
}

export async function unpublishPage(recipientId: string): Promise<Page> {
  const { data } = await apiClient.post<Page>(`/api/v1/admin/pages/${recipientId}/unpublish`)
  return data
}

// ── Media ─────────────────────────────────────────────────────────────────────

export async function uploadAvatar(recipientId: string, file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<{ url: string }>(
    `/api/v1/admin/recipients/${recipientId}/avatar`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.url
}

export async function uploadMedia(
  recipientId: string,
  file: File,
  caption?: string,
): Promise<MediaAssetAdmin> {
  const form = new FormData()
  form.append('file', file)
  if (caption) form.append('caption', caption)
  const { data } = await apiClient.post<MediaAssetAdmin>(
    `/api/v1/admin/pages/${recipientId}/media`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function deleteMediaAsset(recipientId: string, assetId: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/pages/${recipientId}/media/${assetId}`)
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getAnalytics(): Promise<AnalyticsResponse> {
  const { data } = await apiClient.get<AnalyticsResponse>('/api/v1/admin/analytics')
  return data
}

export async function exportAnalyticsCsv(): Promise<Blob> {
  const { data } = await apiClient.get<Blob>('/api/v1/admin/analytics/export', {
    responseType: 'blob',
  })
  return data
}

// ── Invitations ───────────────────────────────────────────────────────────────

export async function getInvitationStatus(recipientId: string): Promise<InvitationStatus> {
  const { data } = await apiClient.get<InvitationStatus>(
    `/api/v1/admin/invitations/${recipientId}`,
  )
  return data
}

export async function generateInvitation(
  recipientId: string,
): Promise<GenerateInvitationResponse> {
  const { data } = await apiClient.post<GenerateInvitationResponse>(
    `/api/v1/admin/invitations/${recipientId}/generate`,
  )
  return data
}

export async function resetTrustedDevice(recipientId: string): Promise<void> {
  await apiClient.post(`/api/v1/admin/invitations/${recipientId}/reset-device`)
}

// ── Admin login ───────────────────────────────────────────────────────────────

export async function adminLogin(email: string, password: string): Promise<void> {
  await apiClient.post('/api/v1/auth/admin-login', { email, password })
}

// ── Memory Vault ─────────────────────────────────────────────────────────────

export async function listMemories(
  recipientId: string,
  params?: { skip?: number; limit?: number; search?: string; favourites_only?: boolean },
): Promise<MemoryListResponse> {
  const { data } = await apiClient.get<MemoryListResponse>(
    `/api/v1/admin/memories/by-recipient/${recipientId}`,
    { params },
  )
  return data
}

export async function toggleMemoryFavourite(entryId: string): Promise<MemoryEntry> {
  const { data } = await apiClient.post<MemoryEntry>(
    `/api/v1/admin/memories/entries/${entryId}/favourite`,
  )
  return data
}

export async function hideMemory(entryId: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/memories/entries/${entryId}`)
}

export async function exportMemoriesCsv(recipientId: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(
    `/api/v1/admin/memories/by-recipient/${recipientId}/export`,
    { responseType: 'blob' },
  )
  return data
}
