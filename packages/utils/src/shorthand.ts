const ALL = 'all' as const;

/**
 * List of shorthand properties that should be sorted (or expanded).
 *
 * This list is outdated and should be expanded to include all shorthand properties—there are 71 as of writing.
 *
 * Source MDN Web Docs (unclear which list is complete as there's a minor discrepenency)
 * @see https://github.com/search?q=repo%3Amdn%2Fcontent%20%22%23%23%20Constituent%20properties%22&type=code
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties#shorthand_properties
 */
export const shorthandFor: { [key: string]: true | string[] } = {
  [ALL]: true, // This is a special case, it's a shorthand for all properties
  // TODO: Add all shorthand properties
  // animation
  // animation-range
  // background
  // border-color
  // border-image
  // border-radius
  // border-style
  // border-width
  // column-rule
  // columns
  // contain-intrinsic-size
  // container
  // flex
  // flex-flow
  // font-synthesis
  // gap
  // list-style
  // mask
  // mask-border
  // offset
  // overscroll-behavior
  // padding
  // padding-block
  // padding-inline
  // place-content
  // place-items
  // place-self
  // position-try
  // scroll-margin
  // scroll-margin-block
  // scroll-margin-inline
  // scroll-padding
  // scroll-padding-block
  // scroll-padding-inline
  // scroll-timeline
  // transition
  // view-timeline
  // -webkit-text-stroke
  // -webkit-border-before
  // -webkit-mask-box-image
  border: [
    'border-block',
    'border-block-end',
    'border-block-end-color',
    'border-block-end-style',
    'border-block-end-width',
    'border-block-start',
    'border-block-start-color',
    'border-block-start-style',
    'border-block-start-width',
    'border-bottom',
    'border-bottom-color',
    'border-bottom-style',
    'border-bottom-width',
    'border-inline',
    'border-inline-end',
    'border-inline-end-color',
    'border-inline-end-style',
    'border-inline-end-width',
    'border-inline-start',
    'border-inline-start-color',
    'border-inline-start-style',
    'border-inline-start-width',
    'border-left',
    'border-left-color',
    'border-left-style',
    'border-left-width',
    'border-right',
    'border-right-color',
    'border-right-style',
    'border-right-width',
    'border-top',
    'border-top-color',
    'border-top-style',
    'border-top-width',
  ],
  'border-top': [
    'border-top-color',
    'border-top-style',
    'border-top-width',
    'border-block-start',
    'border-block-start-color',
    'border-block-start-style',
    'border-block-start-width',
    'border-block-end',
    'border-block-end-color',
    'border-block-end-style',
    'border-block-end-width',
  ],
  'border-right': [
    'border-right-color',
    'border-right-style',
    'border-right-width',
    'border-inline-start',
    'border-inline-start-color',
    'border-inline-start-style',
    'border-inline-start-width',
    'border-inline-end',
    'border-inline-end-color',
    'border-inline-end-style',
    'border-inline-end-width',
  ],
  'border-bottom': [
    'border-bottom-color',
    'border-bottom-style',
    'border-bottom-width',
    'border-block-start',
    'border-block-start-color',
    'border-block-start-style',
    'border-block-start-width',
    'border-block-end',
    'border-block-end-color',
    'border-block-end-style',
    'border-block-end-width',
  ],
  'border-left': [
    'border-left-color',
    'border-left-style',
    'border-left-width',
    'border-inline-start',
    'border-inline-start-color',
    'border-inline-start-style',
    'border-inline-start-width',
    'border-inline-end',
    'border-inline-end-color',
    'border-inline-end-style',
    'border-inline-end-width',
  ],
  'border-inline': [
    'border-inline-start',
    'border-inline-start-color',
    'border-inline-start-style',
    'border-inline-start-width',
    'border-inline-end',
    'border-inline-end-color',
    'border-inline-end-style',
    'border-inline-end-width',
    'border-left-color',
    'border-left-style',
    'border-left-width',
    'border-right-color',
    'border-right-style',
    'border-right-width',
  ],
  'border-inline-start': [
    'border-inline-start-color',
    'border-inline-start-style',
    'border-inline-start-width',
    'border-left-color',
    'border-left-style',
    'border-left-width',
    'border-right-color',
    'border-right-style',
    'border-right-width',
  ],
  'border-inline-end': [
    'border-inline-end-color',
    'border-inline-end-style',
    'border-inline-end-width',
    'border-left-color',
    'border-left-style',
    'border-left-width',
    'border-right-color',
    'border-right-style',
    'border-right-width',
  ],
  'border-block': [
    'border-block-start',
    'border-block-start-color',
    'border-block-start-style',
    'border-block-start-width',
    'border-block-end',
    'border-block-end-color',
    'border-block-end-style',
    'border-block-end-width',
    'border-top-color',
    'border-top-style',
    'border-top-width',
    'border-bottom-color',
    'border-bottom-style',
    'border-bottom-width',
  ],
  'border-block-start': [
    'border-block-start-color',
    'border-block-start-style',
    'border-block-start-width',
    'border-top-color',
    'border-top-style',
    'border-top-width',
    'border-bottom-color',
    'border-bottom-style',
    'border-bottom-width',
  ],
  'border-block-end': [
    'border-block-end-color',
    'border-block-end-style',
    'border-block-end-width',
    'border-top-color',
    'border-top-style',
    'border-top-width',
    'border-bottom-color',
    'border-bottom-style',
    'border-bottom-width',
  ],
  font: [
    'font-style',
    'font-variant',
    'font-variant-alternates',
    'font-variant-caps',
    'font-variant-east-asian',
    'font-variant-emoji',
    'font-variant-ligatures',
    'font-variant-numeric',
    'font-variant-position',
    'font-weight',
    'font-stretch',
    'font-size',
    'line-height',
    'font-family',
  ],
  'font-variant': [
    'font-variant-alternates',
    'font-variant-caps',
    'font-variant-east-asian',
    'font-variant-emoji',
    'font-variant-ligatures',
    'font-variant-numeric',
    'font-variant-position',
  ],
  grid: [
    'grid-template',
    'grid-template-rows',
    'grid-template-columns',
    'grid-template-areas',
    'grid-auto-rows',
    'grid-auto-columns',
    'grid-auto-flow',
  ],
  'grid-area': [
    'grid-column',
    'grid-column-end',
    'grid-column-start',
    'grid-row',
    'grid-row-end',
    'grid-row-start',
  ],
  'grid-column': ['grid-column-end', 'grid-column-start'],
  'grid-row': ['grid-row-end', 'grid-row-start'],
  'grid-template': ['grid-template-rows', 'grid-template-columns', 'grid-template-areas'],
  inset: [
    'top',
    'right',
    'bottom',
    'left',
    'inset-block',
    'inset-block-start',
    'inset-block-end',
    'inset-inline',
    'inset-inline-start',
    'inset-inline-end',
  ],
  'inset-block': ['inset-block-start', 'inset-block-end', 'top', 'bottom'],
  'inset-inline': ['inset-inline-start', 'inset-inline-end', 'left', 'right'],
  margin: [
    'margin-block',
    'margin-block-end',
    'margin-block-start',
    'margin-bottom',
    'margin-inline',
    'margin-inline-end',
    'margin-inline-start',
    'margin-left',
    'margin-right',
    'margin-top',
  ],
  'margin-block': ['margin-block-start', 'margin-block-end', 'margin-top', 'margin-bottom'],
  'margin-inline': ['margin-inline-start', 'margin-inline-end', 'margin-left', 'margin-right'],
  padding: [
    'padding-block',
    'padding-block-end',
    'padding-block-start',
    'padding-bottom',
    'padding-inline',
    'padding-inline-end',
    'padding-inline-start',
    'padding-left',
    'padding-right',
    'padding-top',
  ],
  'padding-block': ['padding-block-start', 'padding-block-end', 'padding-top', 'padding-bottom'],
  'padding-inline': ['padding-inline-start', 'padding-inline-end', 'padding-left', 'padding-right'],
  'text-decoration': [
    'text-decoration-color',
    'text-decoration-line',
    'text-decoration-style',
    'text-decoration-thickness',
  ],
  'text-emphasis': ['text-emphasis-color', 'text-emphasis-style'],
  'text-wrap': ['text-wrap-mode', 'text-wrap-style'],
  overflow: ['overflow-x', 'overflow-y'],
  outline: ['outline-color', 'outline-style', 'outline-width'],
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
  if (shorthand === ALL) {
    return 'root';
  }

  if (!shorthandFor[shorthand]) return null;

  // All shorthands (aside from 'all') are top-level shorthands (not a subset of another shorthand)
  if (!shorthand.includes('-')) return 1;

  let valid = true;
  const parts = shorthand.split('-');
  for (let i = 0; i < parts.length; i++) {
    if (!shorthandFor[parts.slice(0, i + 1).join('-')]) {
      valid = true;
    }
  }

  if (valid && (parts.length === 1 || parts.length === 2 || parts.length === 3)) {
    return parts.length;
  } else {
    console.error(`Invalid shorthand not properly categorized: ${shorthand}`);
  }

  return null;
};
