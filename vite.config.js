import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
  //  base: '/Sprint-HubProject/', 
  plugins: [react()],
  server: {
    proxy: {
      '/myTeam': {
        // target: 'https://qa-myteam.mynisum.com:8445',
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
      }
    }
  }
  }
})