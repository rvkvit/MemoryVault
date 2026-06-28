import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteMediaAsset,
  getAdminPage,
  publishPage,
  unpublishPage,
  uploadMedia,
  upsertPage,
} from '@/lib/api/admin'
import type { PageUpdate } from '@/types/farewell'

export const pageKeys = {
  detail: (recipientId: string) => ['admin', 'page', recipientId] as const,
}

export function useAdminPage(recipientId: string) {
  return useQuery({
    queryKey: pageKeys.detail(recipientId),
    queryFn: () => getAdminPage(recipientId),
    enabled: Boolean(recipientId),
    retry: (count, error: unknown) => {
      // Don't retry 404 — page just doesn't exist yet
      const status = (error as { response?: { status?: number } })?.response?.status
      return status !== 404 && count < 2
    },
  })
}

export function useUpsertPage(recipientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PageUpdate) => upsertPage(recipientId, body),
    onSuccess: (page) => {
      qc.setQueryData(pageKeys.detail(recipientId), page)
      void qc.invalidateQueries({ queryKey: ['admin', 'analytics'] })
    },
  })
}

export function usePublishPage(recipientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => publishPage(recipientId),
    onSuccess: (page) => {
      qc.setQueryData(pageKeys.detail(recipientId), page)
      void qc.invalidateQueries({ queryKey: ['admin', 'analytics'] })
    },
  })
}

export function useUnpublishPage(recipientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => unpublishPage(recipientId),
    onSuccess: (page) => {
      qc.setQueryData(pageKeys.detail(recipientId), page)
      void qc.invalidateQueries({ queryKey: ['admin', 'analytics'] })
    },
  })
}

export function useUploadMedia(recipientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, caption }: { file: File; caption?: string }) =>
      uploadMedia(recipientId, file, caption),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pageKeys.detail(recipientId) })
    },
  })
}

export function useDeleteMedia(recipientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assetId: string) => deleteMediaAsset(recipientId, assetId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pageKeys.detail(recipientId) })
    },
  })
}
