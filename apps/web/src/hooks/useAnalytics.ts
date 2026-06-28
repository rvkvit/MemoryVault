import { useQuery } from '@tanstack/react-query'
import { getAnalytics } from '@/lib/api/admin'

export const analyticsKeys = {
  all: ['admin', 'analytics'] as const,
}

export function useAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.all,
    queryFn: getAnalytics,
    staleTime: 30_000,
  })
}
