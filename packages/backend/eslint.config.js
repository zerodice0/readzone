const rootConfig = require('../../eslint.config.js');

module.exports = [
  ...rootConfig,

  // Backend-specific configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        setImmediate: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    rules: {
      'import/no-cycle': 'off', // Disabled for NestJS circular dependencies
      // Relax unsafe any rules for Prisma and NestJS patterns
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
    },
  },

  // Backend-specific ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'test/**', // E2E test files
      'test-*.ts', // Test scripts
      'prisma/seed.ts', // Seed file (uses console intentionally)
      '**/*.spec.ts', // Unit test files
      '**/__tests__/**', // Test directories
    ],
  },
];
