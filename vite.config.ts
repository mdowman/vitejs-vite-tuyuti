import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import liveReload from 'vite-plugin-live-reload';
console.log('boo');
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), liveReload('lib/**/*.svelte')],
});
