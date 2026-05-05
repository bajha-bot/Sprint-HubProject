import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
  //  base: '/Sprint-HubProject/', 
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/myTeam': {
        target: env.VITE_API_BASE_URL,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.apptoken) {
              proxyReq.setHeader('AppToken', req.headers.apptoken);
            }
          });
        }
      },
      '/api': {
        target: env.VITE_SERVER_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
  }
})