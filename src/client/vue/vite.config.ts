import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  process.env = { ...process.env, ...env };

  return {
    build: {
      outDir: '../../../dist/client',
    },
    plugins: [vue()],
    root: __dirname,
  };
});
