import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Explícito a propósito: fotos y audios NO viajan por Server Actions, van directos a Storage.
    serverActions: { bodySizeLimit: '1mb' },
  },
};

export default nextConfig;
