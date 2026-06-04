// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  // Base recommended rules
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Project-wide settings
  {
    languageOptions: {
      parserOptions: {
        // tsconfig.eslint.json extends tsconfig.json and also includes tests/
        project: './tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // ── TypeScript ──────────────────────────────────────────────
      // Allow explicit `any` with a warning (some typed `any` in edge cases)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Unused variables: error except for args/vars prefixed with _
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // No floating promises — Fastify handlers must await properly
      '@typescript-eslint/no-floating-promises': 'error',
      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // ── Console ─────────────────────────────────────────────────
      // console.log = debug artifact → error  (STANDARDS: no console.log in prod)
      // console.info/warn/error = operational logs → allowed (cron, redis, scrapers)
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    },
  },

  // Relax rules in test files
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-console': 'off',
    },
  },

  // Ignore generated, config, and build artifacts
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'prisma/migrations/**',
      'prisma/seed.ts',        // not included in tsconfig, run separately with tsx
      'coverage/**',
      'eslint.config.mjs',     // not a TS project file
    ],
  },
);
