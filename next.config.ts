import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Allow all remote patterns for development
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Allow local IP addresses for development (required for localhost:4000 uploads)
    dangerouslyAllowLocalIP: true,
    // Disable Image Optimization for local development to avoid localhost issues
    unoptimized: process.env.NODE_ENV === 'development',
  },
  reactStrictMode: true,
  // swcMinify is removed - it's now enabled by default in Next.js 14+
}

export default nextConfig