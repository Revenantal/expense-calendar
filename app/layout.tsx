import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// `?? ` alone doesn't catch an empty string, which is exactly what an unset
// but present Vercel env var evaluates to — that reached `new URL('')` and
// crashed the build with "Invalid URL" rather than falling back.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Expense Calendar',
  description: 'See upcoming income and expenses laid out by date.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#141413',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
