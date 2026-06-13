import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'ChampApp · Champagnat Rugby',
        short_name: 'ChampApp',
        description: 'Asistencia, perfiles, gimnasio y partidos del Champagnat Club Rugby.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#07243D',
        theme_color: '#0E3A5C',
        lang: 'es',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Las llamadas a Supabase (auth, datos, realtime) nunca se cachean:
        // solo se precachea el shell estatico de la app (JS/CSS/HTML/iconos).
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Listeners de notificaciones push (push / notificationclick).
        importScripts: ['push-sw.js'],
      },
    }),
  ],
})
