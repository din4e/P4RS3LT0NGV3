const path = require('path')
const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Parent repo (P4RS3LT0NGV3) also has package-lock.json; without this, Next
  // picks the wrong workspace root and file tracing can stall or take extreme time.
  outputFileTracingRoot: path.join(__dirname),
  // Windows: disable experimental tracing to avoid 0xc0000005 crash
  experimental: {
    outputFileTracing: false,
  },
  images: { unoptimized: true },
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
  // Windows: persistent webpack cache + AV/OneDrive often causes ENOENT on pack rename
  // and leaves .next inconsistent (e.g. missing pages-manifest.json).
  webpack: (config, { dev }) => {
    if (!dev) config.cache = false
    return config
  },
  // Windows: Next's lint worker sometimes crashes with 0xc0000005 during `next build`.
  eslint: { ignoreDuringBuilds: true },
}

module.exports = withNextIntl(nextConfig)
