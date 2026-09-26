import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Fixed port so it doesn't collide with other local projects on 5173.
  // Must match FRONTEND_URL in backend/.env (CORS + OAuth redirect).
  server: {
    port: 5180,
    strictPort: true,
  },
})
