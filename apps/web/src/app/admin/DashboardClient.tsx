'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { BulkActionsBar } from '@/components/admin/BulkActionsBar'
import { RecipientTable } from '@/components/admin/RecipientTable'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { useDeleteRecipient } from '@/hooks/useRecipients'
import { useAnalytics, analyticsKeys } from '@/hooks/useAnalytics'
import type { RecipientAnalyticsRow } from '@/types/farewell'

interface DashboardClientProps {
  initialRows: RecipientAnalyticsRow[]
}

export function DashboardClient({ initialRows }: DashboardClientProps) {
  const router      = useRouter()
  const queryClient = useQueryClient()

  const { data: analytics } = useAnalytics()
  const rows = analytics?.recipients ?? initialRows

  const deleteMutation = useDeleteRecipient()
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null)

  const handleDelete = (id: string, name: string) => setTarget({ id, name })

  const confirmDelete = () => {
    if (!target) return
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        setTarget(null)
        router.refresh()
      },
    })
  }

  const handleBulkComplete = () => {
    void queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
  }

  return (
    <>
      <BulkActionsBar rows={rows} onComplete={handleBulkComplete} />

      <RecipientTable
        rows={rows}
        loading={false}
        onDelete={handleDelete}
      />

      <ConfirmModal
        open={Boolean(target)}
        title={`Remove ${target?.name ?? 'this colleague'}?`}
        description="Their farewell page and all associated content will be deactivated. This action can be reversed by an administrator directly in the database."
        confirmLabel="Remove"
        danger
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
