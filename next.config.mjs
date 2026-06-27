/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Konva SSR compatibility
  webpack: (config) => {
    // Allow pdfjs-dist to work
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
