import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Add legacy-to-new URL redirects here when replacing an existing site.
  // Track the mapping in docs/project/sitemap-and-redirects.md.
  async redirects() {
    return []
  },
}

export default nextConfig
