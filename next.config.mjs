/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    reactCompiler: false,
  },
  async redirects() {
    return [
      /* Ghost /feed/ adresini /rss/'e yonlendiriyordu. Besleme okuyucusuna
         bir kez /feed vermis olan herkes icin bu yonlendirme surmeli. */
      { source: '/feed', destination: '/rss', permanent: true },
    ];
  },
};

export default nextConfig;
