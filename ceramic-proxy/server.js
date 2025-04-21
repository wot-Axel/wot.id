const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// CORS configuration
app.use(cors({
  origin: '*', // In production, restrict to your domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Proxy middleware configuration
app.use('/ceramic', createProxyMiddleware({
  target: 'https://gateway.ceramic.network',
  changeOrigin: true,
  pathRewrite: {
    '^/ceramic': '/', // Remove /ceramic path when forwarding
  },
  onProxyRes: function(proxyRes, req, res) {
    // Add CORS headers to the proxy response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  },
  logLevel: 'debug'
}));

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Ceramic CORS proxy running on port ${PORT}`);
});
