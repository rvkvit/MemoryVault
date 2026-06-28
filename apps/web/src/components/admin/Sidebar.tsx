'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Heart, Home, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { apiClient } from '@/lib/api/client'

const NAV = [
  { href: '/admin',            label: 'Dashboard',    icon: Home,      exact: true  },
  { href: '/admin/analytics',  label: 'Analytics',    icon: BarChart2, exact: false },
  { href: '/admin/memories',   label: 'Memory Vault', icon: Heart,     exact: false },
]

export function Sidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    try { await apiClient.post('/api/v1/auth/logout') } catch { /* best-effort */ }
    window.location.href = '/login'
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-56 flex flex-col z-40 bg-[rgba(5,8,16,0.95)] border-r border-[rgba(255,255,255,0.06)] backdrop-blur-xl">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-ms-blue to-copilot-teal shrink-0" />
          <span className="text-body-s font-medium text-[rgba(255,255,255,0.85)] tracking-wide">
            Farewell Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-body-s transition-all duration-150',
                active
                  ? 'bg-ms-blue/15 text-ms-blue border border-ms-blue/20'
                  : 'text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(255,255,255,0.80)]',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[rgba(255,255,255,0.06)]">
        <button
          onClick={() => void handleLogout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-body-s text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.70)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
