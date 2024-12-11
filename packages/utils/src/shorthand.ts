export type ShorthandProperties =
  | 'all'
  | 'animation'
  | 'animation-range'
  | 'background'
  | 'border'
  | 'border-block'
  | 'border-block-end'
  | 'border-block-start'
  | 'border-bottom'
  | 'border-color'
  | 'border-image'
  | 'border-inline'
  | 'border-inline-end'
  | 'border-inline-start'
  | 'border-left'
  | 'border-radius'
  | 'border-right'
  | 'border-style'
  | 'border-top'
  | 'border-width'
  | 'column-rule'
  | 'columns'
  | 'contain-intrinsic-size'
  | 'container'
  | 'flex'
  | 'flex-flow'
  | 'font'
  | 'font-synthesis'
  | 'font-variant'
  | 'gap'
  | 'grid'
  | 'grid-area'
  | 'grid-column'
  | 'grid-row'
  | 'grid-template'
  | 'inset'
  | 'inset-block'
  | 'inset-inline'
  | 'list-style'
  | 'margin'
  | 'margin-block'
  | 'margin-inline'
  | 'mask'
  | 'mask-border'
  | 'offset'
  | 'outline'
  | 'overflow'
  | 'overscroll-behavior'
  | 'padding'
  | 'padding-block'
  | 'padding-inline'
  | 'place-content'
  | 'place-items'
  | 'place-self'
  | 'position-try'
  | 'scroll-margin'
  | 'scroll-margin-block'
  | 'scroll-margin-inline'
  | 'scroll-padding'
  | 'scroll-padding-block'
  | 'scroll-padding-inline'
  | 'scroll-timeline'
  | 'text-decoration'
  | 'text-emphasis'
  | 'text-wrap'
  | 'transition'
  | 'view-timeline';

export type Depths = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * List of shorthand properties that should be sorted (or expanded).
 *
 * Please note these aren't necessarily just shorthand properties against
 * their constituent properties, but also shorthand properties against sibling
 * constituent properties.
 *
 * Example: `border-color` supersedes `border-top-color` and `border-block-color` (and others)
 *
 * The following list is derived from MDN Web Docs - this is not complete, but it
 * tells us which rules developers are likely to use.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties#shorthand_properties
 * @see https://github.com/search?q=repo%3Amdn%2Fcontent%20%22%23%23%20Constituent%20properties%22&type=code
 */
export const shorthandFor: Record<ShorthandProperties, true | readonly string[]> = {
  all: true, // This is a special case, it's a shorthand for all properties
  animation: [
    'animation-delay',
    'animation-direction',
    'animation-duration',
    'animation-fill-mode',
    'animation-iteration-count',
    'animation-name',
    'animation-play-state',
    'animation-timeline',
    'animation-timing-function',
  ],
  'animation-range': ['animation-range-end', 'animation-range-start'],
  background: [
    'background-attachment',
    'background-clip',
    'background-color',
    'background-image',
    'background-origin',
    'background-position',
    'background-repeat',
    'background-size',
  ],
  border: [
    'border-block',
    'border-block-color',
    'border-block-end',
    'border-block-end-color',
    'border-block-end-style',
    'border-block-end-width',
    'border-block-start',
    'border-block-start-color',
    'border-block-start-style',
    'border-block-start-width',
    'border-block-style',
    'border-block-width',
    'border-bottom',
    'border-bottom-color',
    'border-bottom-style',
    'border-bottom-width',
    'border-color',
    'border-inline',
    'border-inline-color',
    'border-inline-end',
    'border-inline-end-color',
    'border-inline-end-style',
    'border-inline-end-width',
    'border-inline-start',
    'border-inline-start-color',
    'border-inline-start-style',
    'border-inline-start-width',
    'border-inline-style',
    'border-inline-width',
    'border-left',
    'border-left-color',
    'border-left-style',
    'border-left-width',
    'border-right',
    'border-right-color',
    'border-right-style',
    'border-right-width',
    'border-style',
    'border-top',
    'border-top-color',
    'border-top-style',
    'border-top-width',
    'border-width',
  ],
  'border-block': [
    'border-block-end',
    'border-block-end-color',
    'border-block-end-style',
    'border-block-end-width',
    'border-block-start',
    'border-block-start-color',
    'border-block-start-style',
    'border-block-start-width',
    'border-bottom-color',
    'border-bottom-style',
    'border-bottom-width',
    'border-top-color',
    'border-top-style',
    'border-top-width',
  ],
  'border-block-end': [
    'border-block-end-color',
    'border-block-end-style',
    'border-block-end-width',
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
  ],
  'border-bottom': [
    'border-block-end-color',
    'border-block-end-style',
    'border-block-end-width',
    'border-bottom-color',
    'border-bottom-style',
    'border-bottom-width',
  ],
  'border-color': [
    'border-block-color',
    'border-block-start-color',
    'border-block-end-color',
    'border-bottom-color',
    'border-inline-color',
    'border-inline-start-color',
    'border-inline-end-color',
    'border-left-color',
    'border-right-color',
    'border-top-color',
  ],
  'border-image': [
    'border-image-outset',
    'border-image-repeat',
    'border-image-slice',
    'border-image-source',
    'border-image-width',
  ],
  'border-inline': [
    'border-inline-end',
    'border-inline-end-color',
    'border-inline-end-style',
    'border-inline-end-width',
    'border-inline-start',
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
  ],
  'border-left': [
    'border-inline-start-color',
    'border-inline-start-style',
    'border-inline-start-width',
    'border-left-color',
    'border-left-style',
    'border-left-width',
  ],
  'border-radius': [
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-end-end-radius',
    'border-end-start-radius',
    'border-start-end-radius',
    'border-start-start-radius',
    'border-top-left-radius',
    'border-top-right-radius',
  ],
  'border-right': [
    'border-inline-end-color',
    'border-inline-end-style',
    'border-inline-end-width',
    'border-right-color',
    'border-right-style',
    'border-right-width',
  ],
  'border-style': [
    'border-block-style',
    'border-block-start-style',
    'border-block-end-style',
    'border-bottom-style',
    'border-inline-style',
    'border-inline-start-style',
    'border-inline-end-style',
    'border-left-style',
    'border-right-style',
    'border-top-style',
  ],
  'border-top': [
    'border-block-start-color',
    'border-block-start-style',
    'border-block-start-width',
    'border-top-color',
    'border-top-style',
    'border-top-width',
  ],
  'border-width': [
    'border-block-width',
    'border-block-start-width',
    'border-block-end-width',
    'border-bottom-width',
    'border-inline-width',
    'border-inline-start-width',
    'border-inline-end-width',
    'border-left-width',
    'border-right-width',
    'border-top-width',
  ],
  'column-rule': ['column-rule-color', 'column-rule-style', 'column-rule-width'],
  columns: ['column-count', 'column-width'],
  'contain-intrinsic-size': [
    'contain-intrinsic-block-size',
    'contain-intrinsic-height',
    'contain-intrinsic-inline-size',
    'contain-intrinsic-width',
  ],
  container: ['container-name', 'container-type'],
  flex: ['flex-basis', 'flex-grow', 'flex-shrink'],
  'flex-flow': ['flex-direction', 'flex-wrap'],
  font: [
    'font-family',
    'font-size',
    'font-stretch',
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
    'line-height',
  ],
  'font-synthesis': [
    'font-synthesis-position',
    'font-synthesis-small-caps',
    'font-synthesis-style',
    'font-synthesis-weight',
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
  gap: ['column-gap', 'row-gap'],
  grid: [
    'grid-auto-columns',
    'grid-auto-flow',
    'grid-auto-rows',
    'grid-template',
    'grid-template-areas',
    'grid-template-columns',
    'grid-template-rows',
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
    'bottom',
    'inset-block',
    'inset-block-start',
    'inset-block-end',
    'inset-inline',
    'inset-inline-start',
    'inset-inline-end',
    'left',
    'right',
    'top',
  ],
  'inset-block': ['inset-block-start', 'inset-block-end', 'top', 'bottom'],
  'inset-inline': ['inset-inline-start', 'inset-inline-end', 'left', 'right'],
  'list-style': ['list-style-image', 'list-style-position', 'list-style-type'],
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
  mask: [
    'mask-clip',
    'mask-composite',
    'mask-image',
    'mask-mode',
    'mask-origin',
    'mask-position',
    'mask-repeat',
    'mask-size',
  ],
  'mask-border': [
    'mask-border-mode',
    'mask-border-outset',
    'mask-border-repeat',
    'mask-border-slice',
    'mask-border-source',
    'mask-border-width',
  ],
  offset: ['offset-anchor', 'offset-distance', 'offset-path', 'offset-position', 'offset-rotate'],
  outline: ['outline-color', 'outline-style', 'outline-width'],
  overflow: ['overflow-x', 'overflow-y', 'overflow-block', 'overflow-inline'],
  'overscroll-behavior': [
    'overscroll-behavior-x',
    'overscroll-behavior-y',
    'overscroll-behavior-inline',
    'overscroll-behavior-block',
  ],
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
  'place-content': ['align-content', 'justify-content'],
  'place-items': ['align-items', 'justify-items'],
  'place-self': ['align-self', 'justify-self'],
  'position-try': ['position-try-order', 'position-try-fallbacks'],
  'scroll-margin': [
    'scroll-margin-block',
    'scroll-margin-block-end',
    'scroll-margin-block-start',
    'scroll-margin-bottom',
    'scroll-margin-inline',
    'scroll-margin-inline-end',
    'scroll-margin-inline-start',
    'scroll-margin-left',
    'scroll-margin-right',
    'scroll-margin-top',
  ],
  'scroll-margin-block': [
    'scroll-margin-block-start',
    'scroll-margin-block-end',
    'scroll-margin-bottom',
    'scroll-margin-top',
  ],
  'scroll-margin-inline': [
    'scroll-margin-inline-start',
    'scroll-margin-inline-end',
    'scroll-margin-left',
    'scroll-margin-right',
  ],
  'scroll-padding': [
    'scroll-padding-block',
    'scroll-padding-block-end',
    'scroll-padding-block-start',
    'scroll-padding-bottom',
    'scroll-padding-inline',
    'scroll-padding-inline-end',
    'scroll-padding-inline-start',
    'scroll-padding-left',
    'scroll-padding-right',
    'scroll-padding-top',
  ],
  'scroll-padding-block': [
    'scroll-padding-block-start',
    'scroll-padding-block-end',
    'scroll-padding-top',
    'scroll-padding-bottom',
  ],
  'scroll-padding-inline': [
    'scroll-padding-inline-start',
    'scroll-padding-inline-end',
    'scroll-padding-left',
    'scroll-padding-right',
  ],
  'scroll-timeline': ['scroll-timeline-name', 'scroll-timeline-axis'],
  'text-decoration': [
    'text-decoration-color',
    'text-decoration-line',
    'text-decoration-style',
    'text-decoration-thickness',
  ],
  'text-emphasis': ['text-emphasis-color', 'text-emphasis-style'],
  'text-wrap': ['text-wrap-mode', 'text-wrap-style'],
  transition: [
    'transition-behavior',
    'transition-delay',
    'transition-duration',
    'transition-property',
    'transition-timing-function',
  ],
  'view-timeline': ['view-timeline-name', 'view-timeline-axis'],
} as const;

// Make sure to update the `shorthandBuckets` variable in `packages/react/src/runtime/shorthand.ts`
// after making changes to this object.
export const shorthandBuckets = {
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
} as const satisfies Record<ShorthandProperties, Depths>;
// ^^ this type lets us enforce that the copy of shorthandBuckets
//    in `packages/react/src/runtime/shorthand.ts`
//    has the exact same contents as this object.
