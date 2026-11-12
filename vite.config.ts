import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Load all vars (no VITE_ filter) — Azure endpoint/key stay server-side in the dev proxy, never in the bundle
  const env = loadEnv(mode, process.cwd(), '');
  const proxy: Record<string, ProxyOptions> = {};
  if (env.AZURE_AI_ENDPOINT) {
    // shortcut: auth header format is [TBD] until the Azure contract arrives (task 4.6)
    proxy['/api/ai/assist'] = {
      target: env.AZURE_AI_ENDPOINT,
      changeOrigin: true,
      rewrite: () => env.AZURE_AI_PATH ?? '',
    };
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173, strictPort: true, proxy },
  };
});
