# @compiled/parcel-optimizer

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
