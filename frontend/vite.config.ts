import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,   // bind to 0.0.0.0 so *.localhost subdomains are reachable
    port: 5173,
    allowedHosts: ['.localhost', 'localhost'], // allow acme.localhost, foo.localhost, etc.
  },
})
