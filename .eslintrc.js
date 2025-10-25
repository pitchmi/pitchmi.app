/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [
    'universe/native',
    'universe/shared/typescript-analysis',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'prettier', 'import'],
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'web-build/',
    'android/',
    'ios/',
    '.expo/',
  ],
  rules: {
    'prettier/prettier': ['error'],
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    'import/order': [
      'warn',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'object', 'type'],
      },
    ],
    'react/react-in-jsx-scope': 'off',
  },
};
