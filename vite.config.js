import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile() // Inline all JS and CSS into single HTML file
  ],
  base: './', // Use relative paths for assets
  optimizeDeps: {
    exclude: ['@isomorphic-git/lightning-fs']
  },
  build: {
    // Ensure compatibility with file:// protocol
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
