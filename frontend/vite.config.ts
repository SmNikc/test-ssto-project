// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.VITE_PORT || 5173),
    proxy: {
      // Важно: /api/health на фронте → /health на бэке (исключено из глобального префикса)
      '^/api/health$': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: () => '/health',
      },
      // Общий API: сохраняем /api (без rewrite) — бэк ожидает глобальный префикс /api
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
        ws: false,
      },
      // WebSocket/socket.io
      '/socket.io': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    port: Number(process.env.VITE_PREVIEW_PORT || 5174),
  },
});
