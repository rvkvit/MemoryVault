import { redirect } from 'next/navigation'

export default function RootPage() {
  // No public homepage — send visitors to the admin login page.
  // Recipients arrive via their invitation link: /api/v1/invite/{token}
  // which the backend validates and then redirects to /to/[slug].
  redirect('/login')
}
