/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'ClimaEC - Lluvias y El Niño en Ecuador',
        short_name: 'ClimaEC',
        description: 'Pronóstico, mapa de lluvia y alertas por El Niño para Ecuador.',
        lang: 'es-EC',
        theme_color: '#0b5cad',
        background_color: '#0b1a2b',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        importScripts: ['push-sw.js'],
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(api|geocoding-api|flood-api|marine-api)\.open-meteo\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 40, maxAgeSeconds: 6 * 3600 },
            },
          },
          {
            urlPattern: /^\/api\/enso$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'enso-api', expiration: { maxEntries: 2, maxAgeSeconds: 24 * 3600 } },
          },
          {
            urlPattern:
              /^https:\/\/(tile\.openstreetmap\.org|[a-z]\.tile\.openstreetmap\.org|tilecache\.rainviewer\.com)\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'map-tiles', expiration: { maxEntries: 200, maxAgeSeconds: 24 * 3600 } },
          },
        ],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1200 },
  test: { environment: 'jsdom', include: ['src/**/*.test.ts', 'api/**/*.test.ts'] },
});
