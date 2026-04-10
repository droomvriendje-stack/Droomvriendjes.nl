import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env variables for the current mode so we can read VITE_API_URL
  // inside the config itself (e.g. for the dev proxy target).
  const env = loadEnv(mode, process.cwd(), '')

  // In development, proxy /api/* to the local backend so relative-URL
  // fetch('/api/...') calls work without CORS issues.
  // The proxy target falls back to localhost:8001 when VITE_API_URL is unset.
  const backendUrl = env.VITE_API_URL || 'http://localhost:8001'

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    preview: {
      port: 3000,
      host: '0.0.0.0',
    },

    // Explicitly allow VITE_API_URL to be embedded in the client bundle.
    // Any variable prefixed with VITE_ is already exposed by default, but
    // listing it here makes the intent clear.
    envPrefix: 'VITE_',
  }
})
