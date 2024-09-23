import type { ShorthandProperties } from '@compiled/utils';

const shorthandFor: Record<ShorthandProperties, true> = {
  all: true,
  animation: true,
  'animation-range': true,
  background: true,
  border: true,
  'border-block': true,
  'border-block-end': true,
  'border-block-start': true,
  'border-bottom': true,
  'border-color': true,
  'border-image': true,
  'border-inline': true,
  'border-inline-end': true,
  'border-inline-start': true,
  'border-left': true,
  'border-radius': true,
  'border-right': true,
  'border-style': true,
  'border-top': true,
  'border-width': true,
  'column-rule': true,
  columns: true,
  'contain-intrinsic-size': true,
  container: true,
  flex: true,
  'flex-flow': true,
  font: true,
  'font-synthesis': true,
  'font-variant': true,
  gap: true,
  grid: true,
  'grid-area': true,
  'grid-column': true,
  'grid-row': true,
  'grid-template': true,
  inset: true,
  'inset-block': true,
  'inset-inline': true,
  'list-style': true,
  margin: true,
  'margin-block': true,
  'margin-inline': true,
  mask: true,
  'mask-border': true,
  offset: true,
  outline: true,
  overflow: true,
  'overscroll-behavior': true,
  padding: true,
  'padding-block': true,
  'padding-inline': true,
  'place-content': true,
  'place-items': true,
  'place-self': true,
  'position-try': true,
  'scroll-margin': true,
  'scroll-margin-block': true,
  'scroll-margin-inline': true,
  'scroll-padding': true,
  'scroll-padding-block': true,
  'scroll-padding-inline': true,
  'scroll-timeline': true,
  'text-decoration': true,
  'text-emphasis': true,
  'text-wrap': true,
  transition: true,
  'view-timeline': true,
};

/** We look at shorthands to determine what level they are because we need some shorthands to override other shorthands…
 * 0 – `all`
 * 1 – `border`, `margin`, `flex`, etc
 * 2 – `border-block`, `border-top` `margin-inline`
 * 3 – `border-block-start`, etc
 * null – `border-top-color`, `border-block-start-color`, `margin-block-start`, `margin-top`, etc (not shorthands)
 *
 * I'm not sure this is the best way to do this, but it _should_ work for known shorthands.
 */
export const getShorthandDepth = (shorthand: string): 'root' | 1 | 2 | 3 | null => {
  if (shorthand === 'all') {
    return 'root';
  }

  if (!(shorthand in shorthandFor)) return null;

  // All shorthands (aside from 'all') are top-level shorthands (not a subset of another shorthand)
  if (!shorthand.includes('-')) return 1;

  let valid = true;
  const parts = shorthand.split('-');
  for (let i = 0; i < parts.length; i++) {
    if (!(parts.slice(0, i + 1).join('-') in shorthandFor)) {
      valid = true;
      break;
    }
  }

  if (valid && (parts.length === 1 || parts.length === 2 || parts.length === 3)) {
    return parts.length;
  } else {
    console.error(`Invalid shorthand not properly categorized: ${shorthand}`);
  }

  return null;
};
