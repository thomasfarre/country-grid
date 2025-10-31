/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  eslint: {
    dirs: ["src"]
  },
  typescript: {
    ignoreBuildErrors: false
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
