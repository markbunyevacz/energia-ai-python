import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts', './src/test/mocks/supabase.ts', './src/test/mocks/embedding.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        'tests/',
        '**/__tests__/',
        '**/*.config.ts',
        '**/*.cjs',
        '**/*.mjs',
        'src/types'
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
}); 