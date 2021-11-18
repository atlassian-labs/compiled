module.exports = {
  root: true,
  ignorePatterns: ['dist', '*.d.ts'],
  overrides: [
    {
      files: ['*.{ts,tsx}'],
      extends: ['plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      plugins: ['react-hooks'],
      rules: {
        'react-hooks/exhaustive-deps': 'warn',
        'react-hooks/rules-of-hooks': 'error',
        'react/display-name': 'off',
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
          },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
        '@typescript-eslint/no-use-before-define': 'off',
      },
    },
    {
      files: ['*.js.flow'],
      extends: ['plugin:flowtype/recommended'],
      plugins: ['flowtype'],
      rules: {
        'flowtype/generic-spacing': 'off',
      },
    },
    {
      files: ['*.json'],
      plugins: ['json-files'],
      rules: {
        'json-files/sort-package-json': 'error',
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
