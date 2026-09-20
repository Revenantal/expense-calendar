/**
 * Shared navigation content.
 *
 * Keep repeated links here rather than hardcoding them in components, so the
 * header, footer, and any sitemap logic stay in sync.
 */

export type NavigationItem = {
  label: string
  href: string
  description?: string
  children?: NavigationItem[]
}

export const mainNavigation = [{ label: 'Home', href: '/' }] as const satisfies NavigationItem[]

export const footerQuickLinks = [{ label: 'Home', href: '/' }] as const satisfies NavigationItem[]
