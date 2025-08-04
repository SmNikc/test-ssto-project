<<<<<<< HEAD
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

=======
CopyEdit
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
<<<<<<< HEAD
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
=======
    open: true,
    proxy: {
      '/api': {
        target: 'https://test-ssto-project.local:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
# });
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
