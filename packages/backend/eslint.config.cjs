const rootConfig = require('../../eslint.config.js');

module.exports = [
  ...rootConfig,

  // Backend-specific configuration for Convex
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        // Node.js globals for Convex actions
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-void': ['error', { allowAsStatement: true }],
    },
  },

  // Backend-specific ignores
  {
    ignores: [
      'convex/_generated/**',
      'dist/**',
      'node_modules/**',
    ],
  },
];
