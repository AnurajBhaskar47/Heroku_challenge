const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API proxy for production (optional - if you want to proxy API calls)
if (process.env.API_BASE_URL) {
  const { createProxyMiddleware } = require('http-proxy-middleware');
  app.use('/api', createProxyMiddleware({
    target: process.env.API_BASE_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api'
    }
  }));
}

// Handle React Router - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
  console.log(`API Base URL: ${process.env.API_BASE_URL || 'Using same origin'}`);
});
