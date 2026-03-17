import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  //  base: '/Sprint-HubProject/', 
  plugins: [react()],
  server: {
    proxy: {
      '/myTeam': {
        // target: 'https://qa-myteam.mynisum.com:8445',
         target: 'https://prodbe-myteam.mynisum.com',
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
})