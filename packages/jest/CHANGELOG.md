# @compiled/jest

## 0.10.6

### Patch Changes

- b3b4b34: Fix `toHaveCompiledCss` in @compiled/jest crashing on SVG elements due to lack of className property and expands tests in `@compiled/react`.

## 0.10.5

### Patch Changes

- a205c087: Fix jest matcher unintentionally kebab-casing css custom properties.

## 0.10.4

### Patch Changes

- 4f5865a1: Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.

## 0.10.3

### Patch Changes

- 04cb7ae7: Update the increaseSpecificity selector to play nicely with jsdom.
- 04cb7ae7: Fix toHaveCompiledCss increasedSpecificity comparison with a target

## 0.10.2

### Patch Changes

- e49b4f08: Allow `@compiled/babel-plugin`'s `increaseSpecificity` to work with `@compiled/jest`'s `toHaveCompiledCss` jest matcher.

## 0.10.1

### Patch Changes

- 749994b4: Add "found similar styles" to assist debugging to the `toHaveCompiledCss` matcher.

## 0.10.0

### Minor Changes

- f8d01fa2: Remove Flow types as they are increasingly difficult to maintain

## 0.9.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

## 0.8.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

## 0.7.4

### Patch Changes

- 08a963fc: Bump flowgen types

## 0.7.3

### Patch Changes

- ad4d257: Update TypeScript and Flow types to support function calls and resolve incorrect typing

## 0.7.2

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed

## 0.7.1

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties

## 0.7.0

### Minor Changes

- 4210ff6: Add flow types support

## 0.6.9

### Patch Changes

- 40bc0d9: Package descriptions have been updated.

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
