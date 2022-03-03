module.exports = {
  root: true,
  ignorePatterns: [
    'dist',
    'flow-typed',
    '*.d.ts',
    'babel-cjs.js',
    'babel-esm.js',
    'storybook-static'
  ],
  overrides: [
    {
      files: ['*.{js,jsx,ts,tsx}'],
      extends: [
        'plugin:import/recommended',
        'plugin:react/recommended',
      ],
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
        'react/display-name': 'off',
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
        'react-hooks/exhaustive-deps': 'warn',
        'react-hooks/rules-of-hooks': 'error',
        // This case is covered by the use of TypeScript so we can safely turn it off.
        'import/export': 'off',
        // We will let TypeScript handle this for tsx? files, and ignore it on jsx? files to enable linting without
        // building packages
        'import/no-extraneous-dependencies': 'error',
        'import/no-unresolved': 'off',
        'import/order': ['error', {
          alphabetize: {
            order: 'asc'
          },
          'newlines-between': 'always'
        }],
        'sort-keys': 'error'
      },
    },
    {
      files: ['*.{ts,tsx}'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
          },
        ],
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
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
