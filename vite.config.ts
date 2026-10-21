import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5178,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          pinyin: ['pinyin-pro'],
          icons: ['lucide-react'],
          docx: ['docx'],
          capture: ['html2canvas'],
        },
      },
    },
  },
});
