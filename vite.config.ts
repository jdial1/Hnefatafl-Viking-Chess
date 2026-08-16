import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function firebaseMessagingSw(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const source = `importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: ${JSON.stringify(env.VITE_FIREBASE_API_KEY ?? '')},
  authDomain: ${JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN ?? '')},
  projectId: ${JSON.stringify(env.VITE_FIREBASE_PROJECT_ID ?? '')},
  storageBucket: ${JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET ?? '')},
  messagingSenderId: ${JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '')},
  appId: ${JSON.stringify(env.VITE_FIREBASE_APP_ID ?? '')},
});
firebase.messaging();
`;
  return {
    name: 'firebase-messaging-sw',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/firebase-messaging-sw.js') {
          next();
          return;
        }
        res.setHeader('Content-Type', 'application/javascript');
        res.end(source);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'firebase-messaging-sw.js', source });
    },
  };
}

export default defineConfig(({ mode }) => {
  const isNative = mode === 'android';

  return {
    base: isNative ? '/' : (process.env.VITE_BASE ?? '/'),
    plugins: [
      react(),
      tailwindcss(),
      ...(isNative
        ? []
        : [
            firebaseMessagingSw(mode),
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
