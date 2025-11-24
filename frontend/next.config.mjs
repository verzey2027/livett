import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeApiUrl = (url = '') => url.replace(/\/+$/, '')
const rawApiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:4000')
const apiDestinationBase = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`

let remoteHostname = 'localhost'
let remoteProtocol = 'http'
try {
  const parsed = new URL(rawApiUrl.startsWith('http') ? rawApiUrl : `https://${rawApiUrl}`)
  remoteHostname = parsed.hostname
  remoteProtocol = parsed.protocol.replace(':', '') || 'https'
} catch {
  // keep defaults
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: remoteProtocol,
        hostname: remoteHostname,
        pathname: '/api/files/public/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  outputFileTracingRoot: path.join(__dirname, '../'),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiDestinationBase}/:path*`,
      },
    ]
  },
  // Increase timeout for API proxy requests
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Allow cross-origin requests from local network
  allowedDevOrigins: [
    'http://10.152.155.220:3000',
    'http://localhost:3000',
  ],
}

export default nextConfig
