# @compiled/utils

## 0.9.2

### Patch Changes

- db572d43: - @compiled/babel-plugin-strip-runtime:
  - Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
  - The previous version of this PR caused a regression where using the classic JSX pragma `/** @jsx jsx */` with Emotion no longer worked; this is now fixed.
  - @compiled/utils: Add JSX pragma regex (as used by `babel-plugin-transform-react-jsx`) directly to @compiled/utils
  - @compiled/eslint-plugin: Use the official JSX pragma regex `/^\s*\*?\s*@jsx\s+([^\s]+)\s*$/m` instead of `/@jsx (\w+)/`; the former is used in `babel-plugin-transform-react-jsx`

## 0.9.1

### Patch Changes

- 3bb89ef9: Reverting jsx pragma fix which is causing runtime errors

## 0.9.0

### Minor Changes

- fbc17ed3: - `@compiled/babel-plugin-strip-runtime`: Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
  - `@compiled/eslint-plugin`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx
  - `@compiled/utils`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx

## 0.8.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

## 0.7.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

## 0.6.17

### Patch Changes

- e887c2b5: Clean up dependencies of packages
- 4877ec38: Bump babel versions

## 0.6.16

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed

## 0.6.15

### Patch Changes

- 3bfe73f: Add preserveLeadingComments util

## 0.6.14

### Patch Changes

- b345bf4: Update dependencies and plugins to use postcss v8

## 0.6.13

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties

## 0.6.12

### Patch Changes

- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.

## 0.6.11

### Patch Changes

- 40bc0d9: Package descriptions have been updated.

## 0.6.10

### Patch Changes

- 992e401: `createError` now takes a second optional argument for the error group.

## 0.6.9

### Patch Changes

- 0bb1c11: Added new `createError` and `toBoolean` functions.

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
