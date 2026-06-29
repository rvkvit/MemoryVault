'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { RecipientForm } from '@/components/admin/RecipientForm'
import { PageEditor } from '@/components/admin/PageEditor'
import { InvitationPanel } from '@/components/admin/InvitationPanel'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils/cn'
import { useDeleteRecipient, useUpdateRecipient, useUploadAvatar } from '@/hooks/useRecipients'
import type { InvitationStatus, Recipient, RecipientUpdate } from '@/types/farewell'

type Tab = 'info' | 'page' | 'invitation'

interface RecipientDetailClientProps {
  recipient: Recipient
  initialInvitation?: InvitationStatus | null
}

export function RecipientDetailClient({ recipient, initialInvitation }: RecipientDetailClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('info')
  const [showDelete, setShowDelete] = useState(false)

  const updateMutation = useUpdateRecipient(recipient.id)
  const deleteMutation = useDeleteRecipient()
  const avatarMutation = useUploadAvatar(recipient.id)

  const handleUpdate = (data: RecipientUpdate) => {
    updateMutation.mutate(data)
  }

  const handleDelete = () => {
    deleteMutation.mutate(recipient.id, {
      onSuccess: () => router.push('/admin'),
    })
  }

  // Use the most up-to-date recipient data after mutations
  const current: Recipient = updateMutation.data ?? recipient

  return (
    <div className="space-y-6">
      {/* Breadcrumb + title */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-body-s text-[rgba(255,255,255,0.38)] hover:text-[rgba(255,255,255,0.65)] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-display-s font-light text-[rgba(255,255,255,0.90)]">
              {current.display_name}
            </h1>
          </div>
          <p className="text-body-s text-[rgba(255,255,255,0.38)]">{current.email}</p>
        </div>

        <GlassButton
          variant="ghost"
          size="sm"
          className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 shrink-0"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </GlassButton>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] w-fit">
        {(['info', 'page', 'invitation'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2 rounded-[9px] text-body-s transition-all duration-150 capitalize',
              tab === t
                ? 'bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.90)]'
                : 'text-[rgba(255,255,255,0.40)] hover:text-[rgba(255,255,255,0.65)]',
            )}
          >
            {t === 'page' ? 'Page Content' : t === 'invitation' ? 'Invitation' : 'Info'}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {(updateMutation.error || deleteMutation.error) && (
        <div className="px-4 py-3 rounded-[10px] bg-red-500/08 border border-red-500/20 text-body-s text-red-400">
          {((updateMutation.error || deleteMutation.error) as Error).message ??
            'Something went wrong. Please try again.'}
        </div>
      )}

      {/* Tab panels */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-6">
        {tab === 'info' && (
          <RecipientForm
            mode="edit"
            initial={current}
            loading={updateMutation.isPending}
            onSubmit={(data) => handleUpdate(data as RecipientUpdate)}
            onAvatarUpload={(file) => avatarMutation.mutate(file)}
            avatarUploading={avatarMutation.isPending}
          />
        )}

        {tab === 'page' && (
          <PageEditor
            recipientId={current.id}
            recipientSlug={current.slug}
          />
        )}

        {tab === 'invitation' && (
          <InvitationPanel
            recipientId={current.id}
            recipientName={current.display_name}
            initialStatus={initialInvitation ?? null}
          />
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmModal
        open={showDelete}
        title={`Remove ${current.display_name}?`}
        description="This deactivates the colleague and their farewell page. Visitors will no longer be able to access it. The record is soft-deleted and can be restored by an administrator."
        confirmLabel="Remove colleague"
        danger
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}
