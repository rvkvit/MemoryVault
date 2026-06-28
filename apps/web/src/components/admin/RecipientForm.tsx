'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils/cn'
import type { Recipient, RecipientCreate, RecipientUpdate } from '@/types/farewell'

interface RecipientFormProps {
  mode: 'create' | 'edit'
  initial?: Recipient
  loading?: boolean
  onSubmit: (data: RecipientCreate | RecipientUpdate) => void
  onAvatarUpload?: (file: File) => void
  avatarUploading?: boolean
}

// Shared text field — avoids repeating input styling
function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-label-s text-[rgba(255,255,255,0.45)] uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

const inputCls = cn(
  'w-full px-3.5 py-2.5 rounded-[10px] text-body-s',
  'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)]',
  'text-[rgba(255,255,255,0.88)] placeholder:text-[rgba(255,255,255,0.22)]',
  'focus:outline-none focus:border-ms-blue/60 focus:bg-[rgba(255,255,255,0.05)] transition-all',
)

export function RecipientForm({
  mode,
  initial,
  loading,
  onSubmit,
  onAvatarUpload,
  avatarUploading,
}: RecipientFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const [fields, setFields] = useState({
    display_name:  initial?.display_name  ?? '',
    email:         initial?.email         ?? '',
    job_title:     initial?.job_title     ?? '',
    department:    initial?.department    ?? '',
    team:          initial?.team          ?? '',
    manager_email: initial?.manager_email ?? '',
    hire_date:     initial?.hire_date     ?? '',
    last_day:      initial?.last_day      ?? '',
  })

  const set = (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned: Record<string, string | null> = {}
    for (const [k, v] of Object.entries(fields)) {
      cleaned[k] = v.trim() || null
    }
    if (mode === 'create') {
      onSubmit({
        email:         cleaned.email!,
        display_name:  cleaned.display_name!,
        job_title:     cleaned.job_title,
        department:    cleaned.department,
        team:          cleaned.team,
        manager_email: cleaned.manager_email,
        hire_date:     cleaned.hire_date,
        last_day:      cleaned.last_day,
      } as RecipientCreate)
    } else {
      // In edit mode, email cannot be changed
      const { email: _ignored, ...rest } = cleaned
      onSubmit(rest as RecipientUpdate)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar upload — only in edit mode */}
      {mode === 'edit' && onAvatarUpload && (
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-ms-blue/50 to-copilot-teal/50 shrink-0">
            {initial?.avatar_blob_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={initial.avatar_blob_url}
                alt={initial.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-white text-xl font-light">
                {initial?.display_name.charAt(0).toUpperCase()}
              </span>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 bg-[rgba(5,8,16,0.65)] flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onAvatarUpload(file)
                e.target.value = ''
              }}
            />
            <GlassButton
              type="button"
              variant="ghost"
              size="sm"
              disabled={avatarUploading}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="w-3.5 h-3.5" />
              Upload photo
            </GlassButton>
            <p className="text-label-s text-[rgba(255,255,255,0.28)] mt-1.5">
              JPEG, PNG or WebP · max 50 MB
            </p>
          </div>
        </div>
      )}

      {/* Two-column grid on wide screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name" required>
          <input
            type="text"
            className={inputCls}
            placeholder="Alice Chen"
            value={fields.display_name}
            onChange={set('display_name')}
            required
            maxLength={255}
          />
        </Field>

        <Field label="Work email" required>
          <input
            type="email"
            className={cn(inputCls, mode === 'edit' && 'opacity-50 cursor-not-allowed')}
            placeholder="alice@company.com"
            value={fields.email}
            onChange={set('email')}
            required={mode === 'create'}
            readOnly={mode === 'edit'}
            tabIndex={mode === 'edit' ? -1 : undefined}
          />
          {mode === 'edit' && (
            <p className="text-label-s text-[rgba(255,255,255,0.25)] mt-1">
              Email cannot be changed after creation.
            </p>
          )}
        </Field>

        <Field label="Job title">
          <input
            type="text"
            className={inputCls}
            placeholder="Senior Engineer"
            value={fields.job_title}
            onChange={set('job_title')}
            maxLength={255}
          />
        </Field>

        <Field label="Department">
          <input
            type="text"
            className={inputCls}
            placeholder="Engineering"
            value={fields.department}
            onChange={set('department')}
            maxLength={255}
          />
        </Field>

        <Field label="Team">
          <input
            type="text"
            className={inputCls}
            placeholder="Platform"
            value={fields.team}
            onChange={set('team')}
            maxLength={255}
          />
        </Field>

        <Field label="Manager email">
          <input
            type="email"
            className={inputCls}
            placeholder="manager@company.com"
            value={fields.manager_email}
            onChange={set('manager_email')}
          />
        </Field>

        <Field label="Hire date">
          <input
            type="date"
            className={inputCls}
            value={fields.hire_date}
            onChange={set('hire_date')}
          />
        </Field>

        <Field label="Last day">
          <input
            type="date"
            className={inputCls}
            value={fields.last_day}
            onChange={set('last_day')}
          />
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <GlassButton type="submit" variant="primary" size="md" loading={loading}>
          {mode === 'create' ? 'Create Colleague' : 'Save Changes'}
        </GlassButton>
      </div>
    </form>
  )
}
