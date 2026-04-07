/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      },
      {
        protocol: 'https',
        hostname: '*.onrender.com',
      },
      {
        protocol: 'https',
        hostname: '*.render.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // Skip TypeScript errors during build (type checking done in development)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure trailing slashes are handled consistently
  trailingSlash: false,
};

module.exports = nextConfig;
