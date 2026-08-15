import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Capacitor serves the bundle from its own asset host, where a service worker
  // would shadow it and pin the app to a stale build.
  const isNative = mode === 'android';

  return {
    base: isNative ? '/' : (process.env.VITE_BASE ?? '/'),
    plugins: [
      react(),
      tailwindcss(),
      ...(isNative
        ? []
        : [
            VitePWA({
              registerType: 'prompt',
              injectRegister: false,
              workbox: {
                globIgnores: ['**/version.json'],
                runtimeCaching: [
                  {
                    urlPattern: /version\.json$/,
                    handler: 'NetworkOnly',
                  },
                ],
              },
              manifest: {
                name: 'Hnefatafl',
                short_name: 'Hnefatafl',
                description: 'Hnefatafl - Nordic Viking Chess',
                theme_color: '#f59e0b',
                icons: [
                  {
                    src: 'pwa-192x192.png',
                    sizes: '192x192',
                    type: 'image/png'
                  },
                  {
                    src: 'pwa-512x512.png',
                    sizes: '512x512',
                    type: 'image/png'
                  }
                ]
              }
            })
          ])
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        ...(isNative
          ? { 'virtual:pwa-register': path.resolve(__dirname, 'src/utils/pwaRegisterStub.ts') }
          : {}),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
