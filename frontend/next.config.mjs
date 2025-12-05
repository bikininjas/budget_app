/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Removed rewrites - using direct API URLs via axios client
  // This avoids baking HTTP URLs at build time
};

export default nextConfig;
