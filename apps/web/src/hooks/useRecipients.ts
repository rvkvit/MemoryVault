import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRecipient,
  deleteRecipient,
  getRecipient,
  listRecipients,
  updateRecipient,
  uploadAvatar,
} from '@/lib/api/admin'
import type { RecipientCreate, RecipientUpdate } from '@/types/farewell'

export const recipientKeys = {
  all: ['admin', 'recipients'] as const,
  detail: (id: string) => ['admin', 'recipients', id] as const,
}

export function useRecipient(id: string) {
  return useQuery({
    queryKey: recipientKeys.detail(id),
    queryFn: () => getRecipient(id),
    enabled: Boolean(id),
  })
}

export function useCreateRecipient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RecipientCreate) => createRecipient(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useUpdateRecipient(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RecipientUpdate) => updateRecipient(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(recipientKeys.detail(id), updated)
      void qc.invalidateQueries({ queryKey: ['admin', 'analytics'] })
    },
  })
}

export function useDeleteRecipient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRecipient(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useUploadAvatar(recipientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(recipientId, file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: recipientKeys.detail(recipientId) })
      void qc.invalidateQueries({ queryKey: ['admin', 'analytics'] })
    },
  })
}
