import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fabelo.io',
      },
      {
        protocol: 'https',
        hostname: 'fabelo.testworkz.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  experimental: {
    reactCompiler: false,
  },
};

export default withPayload(nextConfig);
