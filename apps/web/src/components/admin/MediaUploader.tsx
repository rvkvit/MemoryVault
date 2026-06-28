'use client'

import { useRef, useState } from 'react'
import { Film, ImageIcon, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils/cn'
import { useDeleteMedia, useUploadMedia } from '@/hooks/useAdminPage'
import type { MediaAsset, MediaAssetAdmin } from '@/types/farewell'

interface MediaUploaderProps {
  recipientId: string
  /** Assets already saved on the page (from React Query cache). */
  assets: (MediaAsset | MediaAssetAdmin)[]
  accept?: 'all' | 'photos' | 'videos'
}

type UploadingItem = { id: string; file: File; progress: 'uploading' | 'error' }

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaUploader({ recipientId, assets, accept = 'all' }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<UploadingItem[]>([])
  const [dragOver, setDragOver] = useState(false)

  const uploadMutation = useUploadMedia(recipientId)
  const deleteMutation = useDeleteMedia(recipientId)

  const acceptAttr = {
    all:    'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm',
    photos: 'image/jpeg,image/png,image/webp,image/gif',
    videos: 'video/mp4,video/webm,video/quicktime',
  }[accept]

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return
    Array.from(files).forEach((file) => {
      const id = `${Date.now()}-${Math.random()}`
      setUploading((prev) => [...prev, { id, file, progress: 'uploading' }])

      uploadMutation.mutate(
        { file },
        {
          onSuccess: () => {
            setUploading((prev) => prev.filter((u) => u.id !== id))
          },
          onError: () => {
            setUploading((prev) =>
              prev.map((u) => (u.id === id ? { ...u, progress: 'error' } : u)),
            )
          },
        },
      )
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const photos = assets.filter((a) => a.asset_type === 'photo')
  const videos = assets.filter((a) => a.asset_type === 'video')

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-[12px] p-8 text-center transition-all duration-200 cursor-pointer',
          dragOver
            ? 'border-ms-blue/60 bg-ms-blue/05'
            : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.02)]',
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <UploadCloud className="w-8 h-8 mx-auto mb-3 text-[rgba(255,255,255,0.25)]" />
        <p className="text-body-s text-[rgba(255,255,255,0.55)]">
          Drag and drop files here, or{' '}
          <span className="text-ms-blue underline underline-offset-2">browse</span>
        </p>
        <p className="text-label-s text-[rgba(255,255,255,0.25)] mt-1">
          {accept === 'all'    && 'JPEG, PNG, WebP, GIF, MP4, WebM · max 50 MB each'}
          {accept === 'photos' && 'JPEG, PNG, WebP, GIF · max 50 MB each'}
          {accept === 'videos' && 'MP4, WebM, MOV · max 50 MB each'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* Uploading items */}
      {uploading.map(({ id, file, progress }) => (
        <div
          key={id}
          className={cn(
            'flex items-center gap-3 p-3.5 rounded-[10px] border',
            progress === 'error'
              ? 'border-red-500/30 bg-red-500/05'
              : 'border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.03)]',
          )}
        >
          <Loader2 className={cn('w-4 h-4 shrink-0', progress === 'error' ? 'text-red-400' : 'text-ms-blue animate-spin')} />
          <p className="text-body-s text-[rgba(255,255,255,0.70)] flex-1 truncate">{file.name}</p>
          <p className="text-label-s text-[rgba(255,255,255,0.35)]">
            {progress === 'error' ? 'Upload failed' : `${formatBytes(file.size)}`}
          </p>
          {progress === 'error' && (
            <GlassButton
              variant="ghost"
              size="sm"
              className="!px-2 !py-1.5 text-red-400"
              onClick={() => setUploading((prev) => prev.filter((u) => u.id !== id))}
            >
              Dismiss
            </GlassButton>
          )}
        </div>
      ))}

      {/* Photo grid */}
      {photos.length > 0 && (
        <section>
          <p className="text-label-s text-[rgba(255,255,255,0.35)] uppercase tracking-wider mb-2.5">
            Photos ({photos.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((asset) => (
              <AssetTile
                key={asset.id}
                asset={asset}
                onDelete={() => deleteMutation.mutate(asset.id)}
                deleting={deleteMutation.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Video list */}
      {videos.length > 0 && (
        <section>
          <p className="text-label-s text-[rgba(255,255,255,0.35)] uppercase tracking-wider mb-2.5">
            Videos ({videos.length})
          </p>
          <div className="space-y-2">
            {videos.map((asset) => (
              <VideoRow
                key={asset.id}
                asset={asset}
                onDelete={() => deleteMutation.mutate(asset.id)}
                deleting={deleteMutation.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {assets.length === 0 && uploading.length === 0 && (
        <div className="flex items-center gap-2 text-body-s text-[rgba(255,255,255,0.25)]">
          <ImageIcon className="w-4 h-4" />
          No media uploaded yet
        </div>
      )}
    </div>
  )
}

// ── Asset tile (photo grid) ───────────────────────────────────────────────────

function AssetTile({
  asset,
  onDelete,
  deleting,
}: {
  asset: MediaAsset | MediaAssetAdmin
  onDelete: () => void
  deleting: boolean
}) {
  const url = 'cdn_url' in asset ? asset.cdn_url : null
  return (
    <div className="relative rounded-[10px] overflow-hidden bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] aspect-square group">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={asset.caption ?? ''} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-[rgba(255,255,255,0.15)]" />
        </div>
      )}
      {asset.caption && (
        <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-[rgba(5,8,16,0.80)] to-transparent">
          <p className="text-label-s text-[rgba(255,255,255,0.75)] truncate">{asset.caption}</p>
        </div>
      )}
      <button
        onClick={onDelete}
        disabled={deleting}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-[rgba(5,8,16,0.75)] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
        title="Delete"
      >
        {deleting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}

// ── Video row ─────────────────────────────────────────────────────────────────

function VideoRow({
  asset,
  onDelete,
  deleting,
}: {
  asset: MediaAsset | MediaAssetAdmin
  onDelete: () => void
  deleting: boolean
}) {
  const name = ('file_name' in asset && asset.file_name) ? asset.file_name : asset.id
  const size = 'file_size_bytes' in asset && asset.file_size_bytes ? formatBytes(asset.file_size_bytes) : null

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] group">
      <div className="w-9 h-9 rounded-[8px] bg-soft-violet/10 flex items-center justify-center shrink-0">
        <Film className="w-4.5 h-4.5 text-soft-violet" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-s text-[rgba(255,255,255,0.80)] truncate">{name}</p>
        {(asset.caption || size) && (
          <p className="text-label-s text-[rgba(255,255,255,0.35)] truncate">
            {[asset.caption, size].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-[6px] hover:bg-red-500/10 text-red-400"
        title="Delete"
      >
        {deleting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}
