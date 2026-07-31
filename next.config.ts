import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Remove domains: [] - it's deprecated
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  reactStrictMode: true,
  // swcMinify is removed - it's now enabled by default in Next.js 14+
}

export default nextConfig