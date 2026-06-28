'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminLogin } from '@/lib/api/admin'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await adminLogin(email.trim(), password)
      router.push('/admin')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#050810]">
      <div className="w-full max-w-sm mx-4">
        {/* Logo / brand */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-ms-blue to-copilot-teal" />
          <span className="text-body-m font-medium text-[rgba(255,255,255,0.80)]">
            Farewell Admin
          </span>
        </div>

        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-7">
          <h1 className="text-display-s font-light text-[rgba(255,255,255,0.90)] mb-1">
            Sign in
          </h1>
          <p className="text-body-s text-[rgba(255,255,255,0.40)] mb-6">
            Admin access only
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-label-s text-[rgba(255,255,255,0.50)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] text-body-s text-[rgba(255,255,255,0.85)] placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-ms-blue/50 focus:ring-1 focus:ring-ms-blue/30 transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-label-s text-[rgba(255,255,255,0.50)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] text-body-s text-[rgba(255,255,255,0.85)] placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-ms-blue/50 focus:ring-1 focus:ring-ms-blue/30 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-[10px] bg-red-500/08 border border-red-500/20 text-body-s text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[10px] bg-ms-blue hover:bg-ms-blue/90 disabled:opacity-50 text-body-s font-medium text-white transition-all duration-150"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
