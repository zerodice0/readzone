const rootConfig = require('../../eslint.config.js');

module.exports = [
  ...rootConfig,

  // Shared package configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'import/no-cycle': 'off', // Disabled for shared types/utilities
    },
  },

  // Shared-specific ignores
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
];
