import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2
      }
    },
    testTimeout: 10000, // Reduced from default 5000ms
    hookTimeout: 5000,  // Reduced from default 10000ms
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        '__tests__/**',
        '*.config.{js,ts}',
        'scripts/**',
        '.next/**',
        'app/**', // Exclude Next.js app dir (UI components tested separately)
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['__tests__/**/*.test.ts'],
    setupFiles: ['__tests__/setup.ts'],
    logHeapUsage: false,
    isolate: false, // Faster but less isolated
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
    },
  },
});
