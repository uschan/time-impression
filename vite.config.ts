import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: This ensures assets are loaded relatively (e.g., "./assets/index.js")
  // instead of absolutely (e.g., "/assets/index.js").
  // This allows the app to be deployed under ANY subdirectory (e.g., wildsalt.me/demo/)
  // without hardcoding the path.
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemap for production performance
    minify: 'esbuild', // Faster minification
  }
});