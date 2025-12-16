# @compiled/vite-plugin

## 1.1.2

### Patch Changes

- 86ff4e8: Fix vite-plugin with ESM (`v1.1.1` was a broken version for proper ESM)

## 1.1.1

### Patch Changes

- f54b4c9: Fix ESM support with require() call now that we distribute multiple versions

## 1.1.0

### Minor Changes

- 117eb47: Bump package dependencies to React 18 globally. Replace jsx and jsx-dev runtimes with modern syntax to circumvent `export \*` issues.

### Patch Changes

- 117eb47: Split CJS and ESM exports for the Vite Plugin

## 1.0.0

### Major Changes

- 979ad9d: Add new Vite plugin
