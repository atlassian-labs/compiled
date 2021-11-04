# @compiled/babel-plugin

## 0.10.0

### Minor Changes

- 53a3d71: **Breaking change:** Ternary conditionals will no longer add falsy path styles when expression evaluates truthy

### Patch Changes

- b68411c: Fix styled path check

## 0.9.0

### Minor Changes

- 0b60ae1: Support custom `resolver`
- 2092839: Allow inline strings and inline css mixins in conditional expressions. Fix ordering of styles in template literals.

## 0.8.0

### Minor Changes

- 53935b3: Add `ObjectExpression` support to `css`

## 0.7.0

### Minor Changes

- bcb2a68: Add support for `keyframes`
- a7ab8e1: Add support for conditional rules for `Styled`

### Patch Changes

- e1dc346: Fix missing key prop on generated React elements
- 48805ec: Use the correct expression in the style prop, when an identifier is shadowed by a function argument
- 587e729: Generate CSS for rules defined before a mixin and ensure that mixins can be overriden
- Updated dependencies [bcb2a68]
  - @compiled/css@0.7.0

## 0.6.14

### Patch Changes

- 30ddaf4: Adds a support of computed properties static evaluation in object styles.

## 0.6.13

### Patch Changes

- 40bc0d9: Package descriptions have been updated.
- 1b1c964: The `css` mixin API is now available,
  functioning similarly to the [emotion equivalent](https://emotion.sh/docs/composition).

  ```jsx
  import { css } from '@compiled/react';

  <div
    css={css`
      display: flex;
      font-size: 50px;
      color: blue;
    `}
  >
    blue text
  </div>;
  ```

  For more help, read the docs: https://compiledcssinjs.com/docs/css.

- Updated dependencies [40bc0d9]
- Updated dependencies [1b1c964]
  - @compiled/css@0.6.11
  - @compiled/utils@0.6.11

## 0.6.12

### Patch Changes

- ca573d7: Styled APIs now have display names when running development builds.

## 0.6.10

### Patch Changes

- 37108e4: Compiled dependencies are now using carat range.
- Updated dependencies [992e401]
- Updated dependencies [37108e4]
  - @compiled/utils@0.6.10
  - @compiled/css@0.6.10

## 0.6.9

### Patch Changes

- Updated dependencies [0bb1c11]
- Updated dependencies [0bb1c11]
  - @compiled/css@0.6.9
  - @compiled/utils@0.6.9

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
- Updated dependencies [aea3504]
  - @compiled/css@0.6.8
  - @compiled/utils@0.6.8
