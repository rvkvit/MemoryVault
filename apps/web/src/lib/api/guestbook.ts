import type { GuestbookEntryCreate, GuestbookEntry, GuestbookListResponse } from '@/types/farewell'
import { get, post } from './client'

export async function fetchGuestbookPage(
  slug: string,
  cursor?: string,
  limit = 20,
): Promise<GuestbookListResponse> {
  return get<GuestbookListResponse>(`/api/v1/pages/${slug}/guestbook`, {
    cursor,
    limit,
  })
}

export async function postGuestbookEntry(
  slug: string,
  body: GuestbookEntryCreate,
): Promise<GuestbookEntry> {
  return post<GuestbookEntry>(`/api/v1/pages/${slug}/guestbook`, body)
}
