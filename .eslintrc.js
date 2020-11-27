module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  globals: {
    NodeJS: true,
  },
  rules: {
    indent: ['off', 2],
    quotes: [
      'error',
      'single',
      { avoidEscape: true, allowTemplateLiterals: true },
    ],
    semi: ['error', 'always'],
    'eol-last': ['error', 'always'],
    'no-console': 0,
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-unused-vars': [
      'error',
      {
        args: 'none',
        varsIgnorePattern: '^_',
      },
    ],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'prefer-arrow-callback': ['error'],
    'require-await': 'error',
    'no-case-declarations': 0,
    'prefer-const': [
      'error',
      {
        destructuring: 'all',
        ignoreReadBeforeAssign: false,
      },
    ],
    'no-prototype-builtins': 'off',
    'newline-after-var': ['error', 'always'],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
    ],
    'no-return-await': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    // '@typescript-eslint/explicit-function-return-type': ['error'],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
};
