import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function buildTimestamp() {
  return {
    name: 'build-timestamp',
    transformIndexHtml(html) {
      const ts = new Date().toLocaleString('ko-KR');
      return html.replace('</head>', `<meta name="build-time" content="${ts}" />\n</head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), buildTimestamp()],
  server: {
    port: 5173,
    host: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
    }
  }
});
