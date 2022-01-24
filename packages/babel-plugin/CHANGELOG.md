# @compiled/babel-plugin

## 0.12.0

### Minor Changes

- f139218: Handle destructuring `property: value` pairs returned from arrow functions, and add support for nested and alias destructuring.
- 858146c: Add babel plugins support
- b0adb8a: Added support for conditional expressions when passing an array to the `css` prop of an element

### Patch Changes

- b0adb8a: Fix support for CSS helper call expressions when used in conditional expressions (i.e. the `css(...)` function provided by compiled)

## 0.11.4

### Patch Changes

- 254a6f6: Added ESLint rule to prevent use of extraneous packages, and added these usages of these packages as dependencies. Added new namespace `@compiled-private` to prevent name clashes with existing npm packages.
- c757259: Update type definition dependencies
- 63148ec: Support file importing in babel plugin and add configuration in loaders
- Updated dependencies [c757259]
- Updated dependencies [63148ec]
  - @compiled/css@0.8.1

## 0.11.3

### Patch Changes

- 3b7c188: Refactor the way member expressions are statically evaluated and handle more combinations of expressions within a member
- c2ae4eb: Resolve css-what and nth-check to new versions in @compiled/css
- Updated dependencies [c2ae4eb]
- Updated dependencies [b345bf4]
  - @compiled/css@0.8.0
  - @compiled/utils@0.6.14

## 0.11.2

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties
- Updated dependencies [8c9ab8c]
- Updated dependencies [1ca19be]
  - @compiled/css@0.7.2
  - @compiled/utils@0.6.13

## 0.11.1

### Patch Changes

- 79cfb08: Compiled will no longer try to traverse modules boundaries of its own.
- 14368bb: Fix issue where a styled value function using both object destructuring and a template literal in at least one branch resulted in a CSS error
- 68ebac3: Add support for namespace imports and export specifiers
- 427cead: Compiled now supports turning on the `css` prop using jsx pragmas (both with `@jsx` and `@jsxImportSource`).
- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.
- Updated dependencies [79cfb08]
  - @compiled/css@0.7.1
  - @compiled/utils@0.6.12

## 0.11.0

### Minor Changes

- fa6af90: Add support for nested ternary operators. Additionally, Compiled will no longer transform ternaries into logical statements unless one side is undefined.

### Patch Changes

- e015a3a: Add comment directive `// @compiled-disable(-next)-line) transform-css-prop` to disable Compiled processing on CSS prop

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
