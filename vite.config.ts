import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    svelte()
  ],
  build: {
    outDir: path.resolve(__dirname, '../testVault/flow-scene-switcher'),
    emptyOutDir: false,
  }
})
