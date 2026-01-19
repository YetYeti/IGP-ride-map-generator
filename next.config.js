/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // 确保资源路径正确（相对路径）
  basePath: '',
  assetPrefix: '',
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tile.openstreetmap.org',
      },
      {
        protocol: 'https',
        hostname: '**.basemaps.cartocdn.com',
      },
    ],
  },
}

module.exports = nextConfig
