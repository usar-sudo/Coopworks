import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Tell Next.js where the monorepo root is
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Where Turbopack should resolve monorepo packages from.
  // The actual install root (where node_modules lives) is two levels up; next is resolved from there.
  turbopack: {
    root: path.join(__dirname, '../../../'),
  },
  // Transpile shared monorepo packages
  transpilePackages: ['shared-types', 'shared-lib'],
  // Allow external image domains if needed
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
