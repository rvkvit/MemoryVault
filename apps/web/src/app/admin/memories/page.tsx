import { cookies } from 'next/headers'
import type { PaginatedResponse, RecipientSummary } from '@/types/farewell'
import { MemoryVaultClient } from './MemoryVaultClient'

async function fetchRecipients(cookieHeader: string): Promise<RecipientSummary[]> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000'
  try {
    const res = await fetch(`${backendUrl}/api/v1/admin/recipients?limit=100`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const body = (await res.json()) as PaginatedResponse<RecipientSummary>
    return body.data
  } catch {
    return []
  }
}

export const metadata = { title: 'Memory Vault · Admin' }

export default async function MemoriesPage() {
  const jar = await cookies()
  const cookieHeader = [jar.get('__Host-farewell-session'), jar.get('farewell-session')]
    .filter(Boolean)
    .map((c) => `${c!.name}=${c!.value}`)
    .join('; ')

  const recipients = await fetchRecipients(cookieHeader)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display-s font-light text-[rgba(255,255,255,0.90)]">Memory Vault</h1>
        <p className="text-body-s text-[rgba(255,255,255,0.38)] mt-1">
          Memories left by visitors on farewell pages
        </p>
      </div>

      <MemoryVaultClient recipients={recipients} />
    </div>
  )
}
