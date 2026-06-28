'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[rgba(5,8,16,0.75)] backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            className="relative z-10 w-full max-w-[400px] bg-[rgba(10,17,40,0.98)] border border-[rgba(255,255,255,0.10)] rounded-[16px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1,    opacity: 1, y: 0 }}
            exit={{    scale: 0.96, opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex gap-4">
              {danger && (
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-body-m font-medium text-[rgba(255,255,255,0.90)]">{title}</h3>
                <p className="text-body-s text-[rgba(255,255,255,0.45)] mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end mt-6">
              <GlassButton variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
                Cancel
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="sm"
                loading={loading}
                onClick={onConfirm}
                className={
                  danger
                    ? 'border-red-500/25 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
                    : ''
                }
              >
                {confirmLabel}
              </GlassButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
