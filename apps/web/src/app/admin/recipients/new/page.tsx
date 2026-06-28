'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { RecipientForm } from '@/components/admin/RecipientForm'
import { useCreateRecipient } from '@/hooks/useRecipients'
import type { RecipientCreate } from '@/types/farewell'

export default function NewRecipientPage() {
  const router = useRouter()
  const create = useCreateRecipient()

  const handleSubmit = (data: RecipientCreate) => {
    create.mutate(data as RecipientCreate, {
      onSuccess: (recipient) => {
        router.push(`/admin/recipients/${recipient.id}`)
      },
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-body-s text-[rgba(255,255,255,0.40)] hover:text-[rgba(255,255,255,0.70)] transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      <div>
        <h1 className="text-display-s font-light text-[rgba(255,255,255,0.90)]">Add Colleague</h1>
        <p className="text-body-s text-[rgba(255,255,255,0.38)] mt-1">
          Create a farewell page for a departing team member.
        </p>
      </div>

      {create.error && (
        <div className="px-4 py-3 rounded-[10px] bg-red-500/08 border border-red-500/20 text-body-s text-red-400">
          {(create.error as Error).message ?? 'Something went wrong. Please try again.'}
        </div>
      )}

      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-6">
        <RecipientForm
          mode="create"
          loading={create.isPending}
          onSubmit={(data) => handleSubmit(data as RecipientCreate)}
        />
      </div>
    </div>
  )
}
