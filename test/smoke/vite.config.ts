import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Builds a single ESM bundle of the whole app for the jsdom smoke harness.
export default defineConfig({
  root: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-smoke',
    emptyOutDir: true,
    minify: false,
    target: 'es2022',
    lib: {
      entry: 'test/smoke/entry.tsx',
      formats: ['es'],
      fileName: 'smoke',
    },
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': 'undefined',
    'import.meta.env.VITE_SUPABASE_ANON_KEY': 'undefined',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
