const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'src/app/**',
      'temp_api_test.js',

      // Tooling / configuration
      'eslint.config.js',
      'jest.config.js',
      'config/**'
    ]
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],

    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },

    rules: {
      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],

      '@typescript-eslint/no-explicit-any': 'off',

      'no-empty': 'warn',

      // Allow projects targeting ES2020 while preserving
      // existing error handling without requiring Error.cause.
      'preserve-caught-error': 'off'
    }
  }
];