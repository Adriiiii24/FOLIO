import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // El indicador de desarrollo (la «N» abajo a la izquierda) tapaba la barra de entrada. Los errores de
  // compilación y de ejecución se siguen mostrando.
  devIndicators: false,
  experimental: {
    // Explícito a propósito: fotos y audios NO viajan por Server Actions, van directos a Storage.
    serverActions: { bodySizeLimit: '1mb' },
  },
};

export default nextConfig;
