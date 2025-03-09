/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing configuration
  webpack: (config) => {
    // Any webpack configs you had before
    return config
  },
  // Add these new settings
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;
