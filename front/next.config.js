/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['en', 'my'],
    defaultLocale: 'en',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
    ],
    domains: ['localhost', '127.0.0.1'],
    unoptimized: true, // Disable image optimization for dev
  },
  async rewrites() {
    return [
      // Proxy API requests to backend to avoid CORS in dev
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      // Proxy Reverb (Pusher protocol compatible) WebSocket HTTP upgrade path
      // Pusher client connects to ws(s)://<host>/app/<key>?...
      {
        source: "/app/:path*",
        destination: "http://127.0.0.1:8080/app/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
