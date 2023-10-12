# @compiled/parcel-config

## 0.3.2

### Patch Changes

- Updated dependencies [809cc389]
  - @compiled/parcel-transformer@0.14.0

## 0.3.1

### Patch Changes

- Updated dependencies [c4e6b7c0]
- Updated dependencies [89c5d043]
  - @compiled/parcel-transformer@0.13.0
  - @compiled/parcel-optimizer@0.4.0

## 0.3.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

### Patch Changes

- Updated dependencies [a41e41e6]
- Updated dependencies [f9c957ef]
  - @compiled/parcel-optimizer@0.3.0
  - @compiled/parcel-transformer@0.12.0

## 0.2.0

### Minor Changes

- 966a1080: Changed the approach of stylesheet extraction on Parcel

  - @compiled/parcel-resolver is no longer used
  - Pass styleRules to optimizer via metadata
  - Optimizer then collects styleRules, and inserts it to output HTML

### Patch Changes

- Updated dependencies [966a1080]
  - @compiled/parcel-optimizer@0.2.0
  - @compiled/parcel-transformer@0.11.0

## 0.1.3

### Patch Changes

- Updated dependencies [100f5d5e]
  - @compiled/parcel-transformer@0.10.0

## 0.1.2

### Patch Changes

- e9b0015: Include config.json in package release
- Updated dependencies [e1ac2ed]
- Updated dependencies [e93ed68]
  - @compiled/parcel-transformer@0.9.0

## 0.1.1

### Patch Changes

- 5f231e5: Support stylesheet extraction with Parcel
- Updated dependencies [5f231e5]
  - @compiled/parcel-transformer@0.8.0
  - @compiled/parcel-optimizer@0.1.1
  - @compiled/parcel-resolver@0.1.1
