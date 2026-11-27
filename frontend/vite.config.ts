import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  envDir: '..',
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router/') ||
            id.includes('/node_modules/react-router-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('/node_modules/@pdf-lib/standard-fonts/')) {
            return 'vendor-pdf-fonts';
          }
          if (id.includes('/node_modules/pdf-lib/')) {
            return 'vendor-pdf-core';
          }
          return undefined;
        },
      },
    },
  },
})
