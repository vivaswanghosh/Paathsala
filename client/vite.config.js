import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-quill/dist': path.resolve(__dirname, '../node_modules/react-quill/dist'),
      'react-quill': path.resolve(__dirname, '../node_modules/react-quill'),
    }
  },
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
})