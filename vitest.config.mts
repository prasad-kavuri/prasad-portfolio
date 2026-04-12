import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    css: false,
    exclude: ['node_modules', 'e2e/**'],
    coverage: {
      provider: 'v8',
      thresholds: {
        // Global baseline
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
        // API routes: high risk — enforce tighter thresholds
        'src/app/api/**': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        // Shared lib utilities: critical path — strictest thresholds
        'src/lib/**': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        // UI components: lower risk, relaxed threshold
        'src/components/**': {
          statements: 70,
          branches: 65,
          functions: 70,
          lines: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
