import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { aiAssistPlugin } from './server/aiAssist';

export default defineConfig(({ mode }) => {
  // Load all vars (no VITE_ filter) — Azure endpoint/key stay server-side in the middleware, never in the bundle
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), aiAssistPlugin(env)],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173, strictPort: true },
  };
});
