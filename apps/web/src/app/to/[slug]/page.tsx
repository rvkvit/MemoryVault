import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchCurrentUserSSR, fetchPageDataSSR } from '@/lib/api/pages'
import { FarewellPageClient } from '@/components/farewell/FarewellPageClient'
import type { UserRole } from '@/types/farewell'

interface Props {
  params: Promise<{ slug: string }>
}

// Dynamic metadata so each page gets the recipient's name in the browser tab
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `Farewell · ${slug}`,
    robots: { index: false, follow: false },
  }
}

// Helper: build a raw Cookie header string from the Next.js cookie store
function buildCookieHeader(store: Awaited<ReturnType<typeof cookies>>): string {
  const names = ['__Host-farewell-session', 'farewell-session']
  return names
    .flatMap((name) => {
      const val = store.get(name)?.value
      return val ? [`${name}=${val}`] : []
    })
    .join('; ')
}

export default async function FarewellPage({ params }: Props) {
  const { slug } = await params
  const cookieStore = await cookies()
  const cookieHeader = buildCookieHeader(cookieStore)

  // ── Fetch main page data + current user (for form pre-fill) ────────────────
  const [{ data, status }, currentUser] = await Promise.all([
    fetchPageDataSSR(slug, cookieHeader),
    fetchCurrentUserSSR(cookieHeader),
  ])

  if (status === 401 || status === 302) {
    redirect('/denied?reason=invitation-required')
  }

  if (status === 403) {
    redirect('/denied')
  }

  if (status === 404 || !data) {
    notFound()
  }

  const role: UserRole = 'recipient'

  return (
    <FarewellPageClient
      data={data}
      role={role}
      currentUserName={currentUser?.name}
      currentUserEmail={currentUser?.email}
    />
  )
}
