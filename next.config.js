/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // Prevent WebAssembly from being bundled for server-side
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Handle pino-pretty dependency issue
      config.externals = [...(config.externals || []), 'pino-pretty'];
    }

    return config
  },
  // Disable server-side rendering for components that use XMTP
  reactStrictMode: true,
  
  // Allow cross-origin requests in development mode for authentication
  allowedDevOrigins: process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:*',  // For browser preview
  ] : [],
}

module.exports = nextConfig
