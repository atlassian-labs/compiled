import type {
  Depths,
  ShorthandProperties,
  shorthandBuckets as ShorthandBucketsType,
} from '@compiled/utils';

// Copied from packages/utils/src/shorthand.ts so that we avoid
// inflating the bundle size of @compiled/react/runtime with the contents
// of @compiled/utils
//
// Keep this `shorthandBuckets` in sync with the `shorthandBuckets` defined in
// packages/utils/src/shorthand.ts
const shorthandBuckets: typeof ShorthandBucketsType = {
  all: 0,
  animation: 1,
  'animation-range': 1,
  background: 1,

  border: 1,
  'border-color': 2,
  'border-style': 2,
  'border-width': 2,

  'border-block': 3,
  'border-inline': 3,

  'border-top': 4,
  'border-right': 4,
  'border-bottom': 4,
  'border-left': 4,

  'border-block-start': 5,
  'border-block-end': 5,
  'border-inline-start': 5,
  'border-inline-end': 5,

  'border-image': 1,
  'border-radius': 1,

  'column-rule': 1,
  columns: 1,
  'contain-intrinsic-size': 1,
  container: 1,
  flex: 1,
  'flex-flow': 1,
  font: 1,
  'font-synthesis': 1,
  'font-variant': 2,
  gap: 1,
  grid: 1,
  'grid-area': 1,
  'grid-column': 2,
  'grid-row': 2,
  'grid-template': 2,
  inset: 1,
  'inset-block': 2,
  'inset-inline': 2,
  'list-style': 1,

  margin: 1,
  'margin-block': 2,
  'margin-inline': 2,

  mask: 1,
  'mask-border': 1,
  offset: 1,
  outline: 1,
  overflow: 1,
  'overscroll-behavior': 1,

  padding: 1,
  'padding-block': 2,
  'padding-inline': 2,

  'place-content': 1,
  'place-items': 1,
  'place-self': 1,
  'position-try': 1,

  'scroll-margin': 1,
  'scroll-margin-block': 2,
  'scroll-margin-inline': 2,

  'scroll-padding': 1,
  'scroll-padding-block': 2,
  'scroll-padding-inline': 2,

  'scroll-timeline': 1,
  'text-decoration': 1,
  'text-emphasis': 1,
  'text-wrap': 1,
  transition: 1,
  'view-timeline': 1,
};

/** We look at shorthands to determine what level they are because we need some shorthands to override other shorthands…
 * 0 – `all`
 * 1 – `border`, `margin`, `flex`, etc
 * 2 – `border-block`, `border-top` `margin-inline`
 * 3 – `border-block-end`, etc
 * null – `border-top-color`, `border-block-start-color`, `margin-block-start`, `margin-top`, etc (not shorthands)
 */
export const getShorthandDepth = (shorthand: string): Depths | null => {
  return shorthandBuckets[shorthand as ShorthandProperties] ?? null;
};
