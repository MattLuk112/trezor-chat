import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  process.env = { ...process.env, ...env };

  return {
    build: {
      outDir: '../../../dist/client',
    },
    plugins: [react()],
    root: __dirname,
  };
});
