import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { InvitationStatus, Recipient } from '@/types/farewell'
import { RecipientDetailClient } from './RecipientDetailClient'

async function fetchRecipient(id: string, cookieHeader: string): Promise<Recipient | null> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000'
  try {
    const res = await fetch(`${backendUrl}/api/v1/admin/recipients/${id}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json() as Promise<Recipient>
  } catch {
    return null
  }
}

async function fetchInvitationStatus(
  id: string,
  cookieHeader: string,
): Promise<InvitationStatus | null> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000'
  try {
    const res = await fetch(`${backendUrl}/api/v1/admin/invitations/${id}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json() as Promise<InvitationStatus>
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const jar = await cookies()
  const ch = [jar.get('__Host-farewell-session'), jar.get('farewell-session')]
    .filter(Boolean).map((c) => `${c!.name}=${c!.value}`).join('; ')
  const r = await fetchRecipient(id, ch)
  return { title: r ? `${r.display_name} · Admin` : 'Colleague · Admin' }
}

export default async function RecipientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const jar = await cookies()
  const ch = [jar.get('__Host-farewell-session'), jar.get('farewell-session')]
    .filter(Boolean).map((c) => `${c!.name}=${c!.value}`).join('; ')

  const [recipient, invitation] = await Promise.all([
    fetchRecipient(id, ch),
    fetchInvitationStatus(id, ch),
  ])

  if (!recipient) notFound()

  return <RecipientDetailClient recipient={recipient} initialInvitation={invitation} />
}
