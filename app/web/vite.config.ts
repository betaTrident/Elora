import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      {
        name: 'html-env-replace',
        transformIndexHtml(html) {
          return html.replace('%VITE_SHOPIFY_API_KEY%', env.VITE_SHOPIFY_API_KEY ?? '')
        },
      },
    ],
    server: {
      port: Number(process.env.PORT || 5173),
      strictPort: true,
      host: 'localhost',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${process.env.BACKEND_PORT || 3000}`,
          changeOrigin: true,
        },
        '/health': {
          target: `http://127.0.0.1:${process.env.BACKEND_PORT || 3000}`,
          changeOrigin: true,
        },
      },
    },
    build: { outDir: '../server/public' },
  }
})
