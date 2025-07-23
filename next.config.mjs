/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization settings  
  images: {
    domains: ['localhost', 'search1.kakaocdn.net', 't1.daumcdn.net'],
    formats: ['image/webp', 'image/avif'],
  },
  // Strict mode for better development experience
  reactStrictMode: true,
  // ESLint configuration
  eslint: {
    dirs: ['src'],
  },
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig