import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'BH_')
  // The browser only talks to this origin; these forward to the local services.
  const proxy = {
    '/api': { target: env.BH_SERVER_URL || 'http://127.0.0.1:8000', changeOrigin: true },
    '/toolkit': {
      target: env.BH_TOOLKIT_URL || 'http://127.0.0.1:5000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/toolkit/, ''),
    },
  }
  return {
    plugins: [react()],
    // `npm run dev:mock` (--mode mock) switches the client onto in-browser sample data.
    define: mode === 'mock' ? { 'import.meta.env.VITE_MOCK': JSON.stringify('1') } : {},
    server: { host: '127.0.0.1', port: 3000, strictPort: true, proxy },
    preview: { host: '127.0.0.1', port: 4173, proxy },
  }
})
