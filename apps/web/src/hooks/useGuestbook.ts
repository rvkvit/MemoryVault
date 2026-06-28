'use client'

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { fetchGuestbookPage, postGuestbookEntry } from '@/lib/api/guestbook'
import type { GuestbookEntryCreate, GuestbookListResponse } from '@/types/farewell'

export function useGuestbook(slug: string, initialData?: GuestbookListResponse) {
  const query = useInfiniteQuery({
    queryKey: ['guestbook', slug],
    queryFn: ({ pageParam }) =>
      fetchGuestbookPage(slug, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialData: initialData
      ? { pages: [initialData], pageParams: [undefined] }
      : undefined,
    staleTime: 30_000,
  })

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (body: GuestbookEntryCreate) => postGuestbookEntry(slug, body),
    onSuccess: () => {
      // Invalidate so the new entry appears at the top on next fetch
      void queryClient.invalidateQueries({ queryKey: ['guestbook', slug] })
    },
  })

  const entries = query.data?.pages.flatMap((p) => p.entries) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return {
    entries,
    total,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    isLoading: query.isLoading,
    error: query.error,
    postEntry: mutation.mutateAsync,
    isPosting: mutation.isPending,
    postError: mutation.error,
  }
}
