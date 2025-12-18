/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Removed rewrites - using direct API URLs via axios client
  // This avoids baking HTTP URLs at build time
  
  // FORCE HTTPS EVERYWHERE - Ultra strict CSP
  // Modified for local development to allow localhost connections
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https:; connect-src 'self' http://localhost:8000 http://localhost:8001 https://backend-budget.novacat.fr https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://r2cdn.perplexity.ai;",
          },
          // Remove HSTS for development to allow HTTP
          // {
          //   key: 'Strict-Transport-Security',
          //   value: 'max-age=31536000; includeSubDomains',
          // },
        ],
      },
    ];
  },
};

export default nextConfig;
