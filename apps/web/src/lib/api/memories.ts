import { apiClient } from './client'
import type { MemoryEntry } from '@/types/farewell'

export async function submitMemory(
  slug: string,
  payload: {
    submitter_name: string
    submitter_email?: string
    message: string
    voice?: Blob | null
    image?: File | null
  },
): Promise<MemoryEntry> {
  const form = new FormData()
  form.append('submitter_name', payload.submitter_name)
  if (payload.submitter_email) form.append('submitter_email', payload.submitter_email)
  form.append('message', payload.message)
  if (payload.voice) form.append('voice', payload.voice, 'voice-note.webm')
  if (payload.image) form.append('image', payload.image)

  const { data } = await apiClient.post<MemoryEntry>(
    `/api/v1/pages/${slug}/memories`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}
