import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: {
      cert: '/opt/test-ssto/certs/server.crt',
      key: '/opt/test-ssto/certs/server.key',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
