import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Project Name',
  description: 'Short project description.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
