import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

const spaceGrotesk = Outfit({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Running Dashboard',
  description: 'Garmin running analytics',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${GeistMono.variable}`}>
      <body className="bg-zinc-50 text-zinc-900 antialiased font-sans">{children}</body>
    </html>
  )
}
