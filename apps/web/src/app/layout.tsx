import type { Metadata, Viewport } from 'next'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider'

export const metadata: Metadata = {
  title: {
    default: 'Farewell',
    template: '%s · Farewell',
  },
  description: 'A private farewell experience created just for you.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#050810',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-space-black text-white min-h-dvh antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
