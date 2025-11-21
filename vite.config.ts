import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.GLM_API_KEY': JSON.stringify(env.GLM_API_KEY),
        'process.env.CUSTOM_API_KEY': JSON.stringify(env.CUSTOM_API_KEY),
        'process.env.SUGGEST_WEBHOOK_URL': JSON.stringify(env.SUGGEST_WEBHOOK_URL),
        'process.env.SUGGEST_WEBHOOK_USER': JSON.stringify(env.SUGGEST_WEBHOOK_USER),
        'process.env.SUGGEST_WEBHOOK_PASS': JSON.stringify(env.SUGGEST_WEBHOOK_PASS)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
