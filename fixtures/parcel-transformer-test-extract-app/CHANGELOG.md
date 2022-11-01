# @compiled/parcel-transformer-test-extract-app

## 0.0.3

### Patch Changes

- 966a1080: Changed the approach of stylesheet extraction on Parcel

  - @compiled/parcel-resolver is no longer used
  - Pass styleRules to optimizer via metadata
  - Optimizer then collects styleRules, and inserts it to output HTML

## 0.0.2

### Patch Changes

- Updated dependencies [ad4d257]
- Updated dependencies [1cab89a]
  - @compiled/react@0.11.0
