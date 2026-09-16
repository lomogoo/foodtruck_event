import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves the site from /<repo>/ — override with BASE_PATH when
// deploying elsewhere (Netlify, Vercel, a custom domain: BASE_PATH=/).
const base = process.env.BASE_PATH ?? '/foodtruck_event/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', sourcemap: false },
})
