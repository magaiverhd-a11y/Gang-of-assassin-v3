import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      viteSingleFile(),
      // Kept so a future multi-file build can copy loose assets again.
      // With vite-plugin-singlefile the imported audio is already inside index.html,
      // so this step does not write a second copy.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(): void {
          return;
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
