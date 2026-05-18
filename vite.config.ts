import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    root: 'client',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon-512.png', 'robots.txt'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        },
        manifest: {
          name: 'Tracksup',
          short_name: 'Tracksup',
          description: 'Professional supply chain and delivery management platform.',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'client/src'),
      },
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
