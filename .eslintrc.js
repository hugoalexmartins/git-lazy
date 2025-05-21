module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn'],
    'no-console': 'off',
    'prefer-const': 'warn',
    'arrow-spacing': ['error', { 'before': true, 'after': true }],
    'comma-spacing': ['error', { 'before': false, 'after': true }],
    'keyword-spacing': ['error', { 'before': true, 'after': true }],
    'object-curly-spacing': ['error', 'always'],
    'space-before-blocks': ['error', 'always'],
    'space-before-function-paren': ['error', { 'anonymous': 'always', 'named': 'never', 'asyncArrow': 'always' }],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error'
  }
};