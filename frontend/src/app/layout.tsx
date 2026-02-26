import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TAEK — Taekwondo Registration & Management Platform',
  description: 'Malaysia\'s leading platform for Taekwondo tournament registration, athlete profiles, and event management.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
