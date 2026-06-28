'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Play, Square, Trash2 } from 'lucide-react'

interface VoiceRecorderProps {
  onRecorded: (blob: Blob | null) => void
  maxSeconds?: number
}

type RecorderState = 'idle' | 'recording' | 'recorded'

export function VoiceRecorder({ onRecorded, maxSeconds = 60 }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRef  = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef  = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType: mediaType })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaType })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        onRecorded(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRef.current = recorder
      recorder.start(100)
      setState('recording')
      setElapsed(0)

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= maxSeconds) {
            stopRecording()
            return maxSeconds
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setPermissionDenied(true)
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRef.current?.stop()
    setState('recorded')
  }

  const discard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setState('idle')
    setElapsed(0)
    onRecorded(null)
  }

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      void audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  if (permissionDenied) {
    return (
      <div className="flex items-center gap-2 text-body-s text-[rgba(255,255,255,0.38)]">
        <MicOff className="w-4 h-4" />
        Microphone access denied. Check your browser permissions.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {state === 'idle' && (
        <button
          type="button"
          onClick={() => void startRecording()}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] text-body-s text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[rgba(255,255,255,0.85)] transition-all"
        >
          <Mic className="w-4 h-4" />
          Record a voice note (max {maxSeconds}s)
        </button>
      )}

      {state === 'recording' && (
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-body-s text-[rgba(255,255,255,0.65)] tabular-nums">
            {formatTime(elapsed)} / {formatTime(maxSeconds)}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-red-500/15 border border-red-500/25 text-body-s text-red-400 hover:bg-red-500/20 transition-all"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>
        </div>
      )}

      {state === 'recorded' && audioUrl && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] text-body-s text-[rgba(255,255,255,0.75)] hover:bg-[rgba(255,255,255,0.08)] transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            {isPlaying ? 'Playing…' : 'Play'}
          </button>
          <span className="text-label-s text-[rgba(255,255,255,0.38)]">
            {formatTime(elapsed)}
          </span>
          <button
            type="button"
            onClick={discard}
            className="flex items-center gap-1.5 text-label-s text-[rgba(255,255,255,0.35)] hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Discard
          </button>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
