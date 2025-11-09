const rootConfig = require('../../eslint.config.js');

module.exports = [
  ...rootConfig,

  // Frontend-specific configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        // React globals
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    rules: {
      'import/no-cycle': 'off', // Disabled for React component circular imports
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'no-void': ['error', { allowAsStatement: true }], // Allow void for floating promises
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false, // Allow async handlers in JSX attributes (onClick, onSubmit, etc.)
          },
        },
      ],
    },
  },

  // Frontend-specific ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'build/**',
      'vite.config.ts', // Config files not in tsconfig
      '*.config.ts',
      '*.config.js',
    ],
  },
];
