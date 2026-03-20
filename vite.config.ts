import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const bffTarget = env.VITE_BFF_TARGET || 'http://127.0.0.1:8787';

  return {
    plugins: [react()],
    test: {
      exclude: ['**/.claude/**', '**/dist/**', '**/node_modules/**']
    },
    server: {
      proxy: {
        // Proxy local para manter frontend desacoplado de CORS e de host externo.
        '/api/esl': {
          target: bffTarget,
          changeOrigin: true
        }
      }
    }
  };
});
