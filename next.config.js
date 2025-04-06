/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, buildId, dev, defaultLoaders, webpack }) => {
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
    
    // Explicitly exclude Ceramic and ComposeDB directories from the build
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: /(src\/composedb|src\/utils\/ceramicTester\.ts|src\/utils\/ceramicUtils\.ts)/,
      use: [
        {
          loader: 'null-loader',
        },
      ],
    });

    return config
  },
  // Disable server-side rendering for all components
  reactStrictMode: false,
  
  // Enable ESLint and TypeScript checking during builds
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Define page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Completely disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Allow cross-origin requests in development mode for authentication
  allowedDevOrigins: process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:*',  // For browser preview
  ] : [],
}

export default nextConfig
