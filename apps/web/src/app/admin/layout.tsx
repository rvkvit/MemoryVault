import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'

export const metadata = { title: 'Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const hasSession = jar.has('__Host-farewell-session') || jar.has('farewell-session')
  if (!hasSession) redirect('/login')

  return (
    <div className="min-h-dvh flex">
      <Sidebar />

      {/* Main content — offset by sidebar width on md+ */}
      <main className="flex-1 ml-0 md:ml-56 min-h-dvh overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
