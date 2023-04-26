# @compiled/parcel-optimizer

## 0.4.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

### Patch Changes

- Updated dependencies [c4e6b7c0]
  - @compiled/utils@0.8.0
  - @compiled/css@0.11.0

## 0.3.1

### Patch Changes

- f9c47524: Only invalidate cache on startup when using `.js` config files
- Updated dependencies [f9005e2b]
- Updated dependencies [488deaa6]
  - @compiled/css@0.10.0

## 0.3.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

### Patch Changes

- Updated dependencies [a41e41e6]
- Updated dependencies [f9c957ef]
  - @compiled/css@0.9.0
  - @compiled/utils@0.7.0

## 0.2.2

### Patch Changes

- e887c2b5: Clean up dependencies of packages
- 4877ec38: Bump babel versions
- Updated dependencies [e887c2b5]
- Updated dependencies [4877ec38]
  - @compiled/css@0.8.8
  - @compiled/utils@0.6.17

## 0.2.1

### Patch Changes

- 08a963fc: Bump flowgen types

## 0.2.0

### Minor Changes

- 966a1080: Changed the approach of stylesheet extraction on Parcel

  - @compiled/parcel-resolver is no longer used
  - Pass styleRules to optimizer via metadata
  - Optimizer then collects styleRules, and inserts it to output HTML

## 0.1.1

### Patch Changes

- 5f231e5: Support stylesheet extraction with Parcel
