# @compiled/parcel-optimizer-test-app

## 0.1.2

### Patch Changes

- Updated dependencies [4a2174c5]
- Updated dependencies [c5377cdb]
  - @compiled/react@0.14.0

## 0.1.1

### Patch Changes

- Updated dependencies [c4e6b7c0]
- Updated dependencies [c4e6b7c0]
  - @compiled/react@0.13.0

## 0.1.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

### Patch Changes

- Updated dependencies [a41e41e6]
- Updated dependencies [f9c957ef]
  - @compiled/react@0.12.0

## 0.0.2

### Patch Changes

- 966a1080: Changed the approach of stylesheet extraction on Parcel

  - @compiled/parcel-resolver is no longer used
  - Pass styleRules to optimizer via metadata
  - Optimizer then collects styleRules, and inserts it to output HTML
