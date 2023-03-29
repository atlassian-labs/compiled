# @compiled/parcel-transformer

## 0.12.1

### Patch Changes

- f9c47524: Only invalidate cache on startup when using `.js` config files
  - @compiled/babel-plugin@0.18.1

## 0.12.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12
- f9c957ef: Add an option to compress class names based on "classNameCompressionMap", which is provided by library consumers.
  Add a script to generate compressed class names.

### Patch Changes

- Updated dependencies [a41e41e6]
- Updated dependencies [f9c957ef]
  - @compiled/babel-plugin@0.18.0
  - @compiled/babel-plugin-strip-runtime@0.18.0
  - @compiled/utils@0.7.0

## 0.11.3

### Patch Changes

- 4877ec38: Bump babel versions
- Updated dependencies [e887c2b5]
- Updated dependencies [4877ec38]
  - @compiled/babel-plugin@0.17.3
  - @compiled/utils@0.6.17
  - @compiled/babel-plugin-strip-runtime@0.17.3

## 0.11.2

### Patch Changes

- 08a963fc: Bump flowgen types
- Updated dependencies [14f2091b]
- Updated dependencies [50b51724]
- Updated dependencies [08a963fc]
  - @compiled/babel-plugin@0.17.2
  - @compiled/babel-plugin-strip-runtime@0.17.2

## 0.11.1

### Patch Changes

- Updated dependencies [99af4aa0]
  - @compiled/babel-plugin@0.17.1

## 0.11.0

### Minor Changes

- 966a1080: Changed the approach of stylesheet extraction on Parcel

  - @compiled/parcel-resolver is no longer used
  - Pass styleRules to optimizer via metadata
  - Optimizer then collects styleRules, and inserts it to output HTML

### Patch Changes

- Updated dependencies [966a1080]
  - @compiled/babel-plugin-strip-runtime@0.17.0

## 0.10.0

### Minor Changes

- 100f5d5e: Pass a custom resolver from parcel-transformer to babel plugin

### Patch Changes

- Updated dependencies [fcda0097]
- Updated dependencies [dcb333a2]
- Updated dependencies [5ee1a866]
  - @compiled/babel-plugin@0.16.5

## 0.9.1

### Patch Changes

- a7df222: Use parser babel plugins in parcel transformer

## 0.9.0

### Minor Changes

- e1ac2ed: Rename babelPlugins configuration option to parserBabelPlugins and add transformerBabelPlugins option
- e93ed68: Added configurable options to prevent side effects in SSR

### Patch Changes

- Updated dependencies [e1ac2ed]
- Updated dependencies [4f8f2aa]
- Updated dependencies [d3b5fb9]
- Updated dependencies [e93ed68]
  - @compiled/babel-plugin@0.16.0
  - @compiled/babel-plugin-strip-runtime@0.16.0

## 0.8.1

### Patch Changes

- Updated dependencies [0b38c11]
- Updated dependencies [2d24709]
  - @compiled/babel-plugin@0.15.0

## 0.8.0

### Minor Changes

- 5f231e5: Support stylesheet extraction with Parcel

### Patch Changes

- Updated dependencies [5f231e5]
- Updated dependencies [6d6b579]
  - @compiled/babel-plugin-strip-runtime@0.14.1
  - @compiled/babel-plugin@0.14.1

## 0.7.3

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed
- Updated dependencies [2ad385c]
- Updated dependencies [5e3ad5e]
- Updated dependencies [c96c562]
- Updated dependencies [73821f2]
- Updated dependencies [356b120]
- Updated dependencies [588cd4f]
  - @compiled/babel-plugin@0.14.0
  - @compiled/utils@0.6.16

## 0.7.2

### Patch Changes

- Updated dependencies [307bb83]
- Updated dependencies [18dcdf8]
  - @compiled/babel-plugin@0.13.0

## 0.7.1

### Patch Changes

- 597687c: Bump Parcel to v2.3.2

## 0.7.0

### Minor Changes

- 024ac88: Upgrade parcel transformer to support Parcel v2.2.0

### Patch Changes

- Updated dependencies [b0adb8a]
- Updated dependencies [f139218]
- Updated dependencies [858146c]
- Updated dependencies [b0adb8a]
  - @compiled/babel-plugin@0.12.0

## 0.6.20

### Patch Changes

- c757259: Update type definition dependencies
- Updated dependencies [254a6f6]
- Updated dependencies [c757259]
- Updated dependencies [63148ec]
  - @compiled/babel-plugin@0.11.4

## 0.6.19

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties
- Updated dependencies [8c9ab8c]
  - @compiled/babel-plugin@0.11.2
  - @compiled/utils@0.6.13

## 0.6.18

### Patch Changes

- 427cead: Compiled now supports turning on the `css` prop using jsx pragmas (both with `@jsx` and `@jsxImportSource`).
- Updated dependencies [79cfb08]
- Updated dependencies [14368bb]
- Updated dependencies [68ebac3]
- Updated dependencies [427cead]
- Updated dependencies [79cfb08]
  - @compiled/babel-plugin@0.11.1
  - @compiled/utils@0.6.12

## 0.6.17

### Patch Changes

- Updated dependencies [e015a3a]
- Updated dependencies [fa6af90]
  - @compiled/babel-plugin@0.11.0

## 0.6.16

### Patch Changes

- Updated dependencies [b68411c]
- Updated dependencies [53a3d71]
  - @compiled/babel-plugin@0.10.0

## 0.6.15

### Patch Changes

- Updated dependencies [0b60ae1]
- Updated dependencies [2092839]
  - @compiled/babel-plugin@0.9.0

## 0.6.14

### Patch Changes

- Updated dependencies [53935b3]
  - @compiled/babel-plugin@0.8.0

## 0.6.13

### Patch Changes

- Updated dependencies [bcb2a68]
- Updated dependencies [a7ab8e1]
- Updated dependencies [e1dc346]
- Updated dependencies [48805ec]
- Updated dependencies [587e729]
  - @compiled/babel-plugin@0.7.0

## 0.6.12

### Patch Changes

- 40bc0d9: Package descriptions have been updated.
- Updated dependencies [40bc0d9]
- Updated dependencies [1b1c964]
  - @compiled/babel-plugin@0.6.13
  - @compiled/utils@0.6.11

## 0.6.11

### Patch Changes

- 6a7261e: Programmatic babel use now searches upwards for a project root, and if found will use that config. This fixes issues in some monorepo setups.

## 0.6.10

### Patch Changes

- 37108e4: Compiled dependencies are now using carat range.
- Updated dependencies [992e401]
- Updated dependencies [37108e4]
  - @compiled/utils@0.6.10
  - @compiled/babel-plugin@0.6.10

## 0.6.9

### Patch Changes

- Updated dependencies [0bb1c11]
  - @compiled/utils@0.6.9
  - @compiled/babel-plugin@0.6.9

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
- Updated dependencies [aea3504]
  - @compiled/babel-plugin@0.6.8
  - @compiled/utils@0.6.8
