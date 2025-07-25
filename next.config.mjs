/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization settings (updated for Next.js 15)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'search1.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 't1.daumcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'image.yes24.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Strict mode for better development experience
  reactStrictMode: true,
  // ESLint configuration
  eslint: {
    dirs: ['src'],
  },
  // Performance optimizations for Next.js 15
  experimental: {
    // Enable advanced bundling optimizations
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
    // Enable Server Actions (stable in Next.js 15)
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig