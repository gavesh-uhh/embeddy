/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Konva SSR compatibility
  webpack: (config, { isServer }) => {
    // Allow pdfjs-dist to work
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Handle pdfjs-dist module resolution
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;
