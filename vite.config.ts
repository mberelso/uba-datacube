import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-404',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
  ],
  base: '/',
})
