/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    reactCompiler: false,
  },
};

export default nextConfig;
