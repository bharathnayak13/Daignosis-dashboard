/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'sdc-backend'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
