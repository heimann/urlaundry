import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite';
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  base: './' // This ensures assets are referenced with relative paths
})
