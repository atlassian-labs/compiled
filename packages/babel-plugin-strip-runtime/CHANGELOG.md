# @compiled/babel-plugin-strip-runtime

## 0.25.0

### Minor Changes

- fbc17ed3: - `@compiled/babel-plugin-strip-runtime`: Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
  - `@compiled/eslint-plugin`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx
  - `@compiled/utils`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx

### Patch Changes

- Updated dependencies [fbc17ed3]
  - @compiled/utils@0.9.0
  - @compiled/css@0.12.1

## 0.23.0

### Minor Changes

- 9304fa3b: Add extractStylesToDirectory config to support extraction to CSS files

## 0.19.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

### Patch Changes

- Updated dependencies [c4e6b7c0]
  - @compiled/utils@0.8.0

## 0.18.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

### Patch Changes

- Updated dependencies [a41e41e6]
  - @compiled/utils@0.7.0

## 0.17.3

### Patch Changes

- 4877ec38: Bump babel versions
- Updated dependencies [e887c2b5]
- Updated dependencies [4877ec38]
  - @compiled/utils@0.6.17

## 0.17.2

### Patch Changes

- 08a963fc: Bump flowgen types

## 0.17.0

### Minor Changes

- 966a1080: Changed the approach of stylesheet extraction on Parcel

  - @compiled/parcel-resolver is no longer used
  - Pass styleRules to optimizer via metadata
  - Optimizer then collects styleRules, and inserts it to output HTML

## 0.16.0

### Minor Changes

- e93ed68: Added configurable options to prevent side effects in SSR

## 0.14.1

### Patch Changes

- 5f231e5: Support stylesheet extraction with Parcel

## 0.14.0

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed
- 588cd4f: Adding require statements for atomic css now occurs inside the babel-plugin-strip-runtime plugin
- Updated dependencies [356b120]
  - @compiled/utils@0.6.16

## 0.11.4

### Patch Changes

- c757259: Update type definition dependencies

## 0.11.2

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties

## 0.11.1

### Patch Changes

- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.

## 0.6.13

### Patch Changes

- 40bc0d9: Package descriptions have been updated.

## 0.6.11

### Patch Changes

- b92eb6d: Binding not found error appearing during strip runtime pass has been fixed.

## 0.6.9

### Patch Changes

- 0bb1c11: The `onFoundStyleSheet` option has been replaced by `onFoundStyleSheet`. This callback will be called once with all found styles at the end of the pass.

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
