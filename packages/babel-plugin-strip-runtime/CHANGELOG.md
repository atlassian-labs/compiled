# @compiled/babel-plugin-strip-runtime

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
