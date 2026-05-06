const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  webpack: (config, { dev }) => {
    if (!dev) config.cache = false
    return config
  },
  eslint: { ignoreDuringBuilds: true },
}

module.exports = withNextIntl(nextConfig)
