import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  exportMemoriesCsv,
  hideMemory,
  listMemories,
  toggleMemoryFavourite,
} from '@/lib/api/admin'

export function useMemories(
  pageId: string | null,
  params?: {
    skip?: number
    limit?: number
    search?: string
    favourites_only?: boolean
  },
) {
  return useQuery({
    queryKey: ['memories', pageId, params],
    queryFn: () => listMemories(pageId!, params),
    enabled: !!pageId,
    staleTime: 30_000,
  })
}

export function useToggleMemoryFavourite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleMemoryFavourite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memories'] }),
  })
}

export function useHideMemory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: hideMemory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memories'] }),
  })
}

export function useExportMemories(pageId: string) {
  return useMutation({
    mutationFn: () => exportMemoriesCsv(pageId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memories-${pageId}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
  })
}
