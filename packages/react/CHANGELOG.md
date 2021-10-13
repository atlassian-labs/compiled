# @compiled/react

## 0.8.0

### Minor Changes

- 4210ff6: Add flow types support
- 53935b3: Add `ObjectExpression` support to `css`

## 0.7.0

### Minor Changes

- bcb2a68: Add support for `keyframes`
- a7ab8e1: Add support for conditional rules for `Styled`

## 0.6.13

### Patch Changes

- 13c3a60: add support of additional parameters to css function

## 0.6.12

### Patch Changes

- b5b4e8a: Catch unhandled exception on inserting rules with prefixed selectors.

## 0.6.11

### Patch Changes

- ee3363e: Fix HTML characters escapes in style tags on SSR.

## 0.6.10

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
    `}>
    blue text
  </div>;
  ```

  For more help, read the docs: https://compiledcssinjs.com/docs/css.

## 0.6.9

### Patch Changes

- 4032cd4: Memo has been removed from the style component which was breaking re-renders at times.

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
