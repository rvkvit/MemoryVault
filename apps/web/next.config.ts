import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Proxy /api/v1/* to the FastAPI backend so cookies work same-origin
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/v1/:path*`,
      },
    ]
  },

  images: {
    remotePatterns: [
      // Cloudinary CDN — all environments
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Enforce strict mode for catching React 19 issues early
  reactStrictMode: true,

  // Inline SVGs as React components
  webpack(config) {
    return config
  },
}

export default nextConfig
