import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/server.ts',
        'src/**/*.schema.ts',
        'src/shared/jobs/scraping.job.ts',
      ],
      // CI fails if coverage drops below these — QA standard ISO 25010
      // Baseline (2026-06-04): 87% stmts · 77% branches · 87% funcs · 88% lines
      thresholds: {
        statements: 80,
        branches:   75,
        functions:  80,
        lines:      80,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
