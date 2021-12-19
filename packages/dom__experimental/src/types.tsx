import type * as CSS from 'csstype';

/**
 * Typing for the interpolations.
 */
export type BasicTemplateInterpolations = string | number;

/**
 * These are all the CSS props that will exist.
 */
export type CSSProps = CSS.Properties<BasicTemplateInterpolations>;

export type AnyKeyCssProps<TValue> = {
  [key: string]: AnyKeyCssProps<TValue> | CSSProps | BasicTemplateInterpolations | TValue;
};

/**
 * Buckets under which we will group our stylesheets
 */
export type Bucket =
  // catch-all
  | ''
  // link
  | 'l'
  // visited
  | 'v'
  // focus-within
  | 'w'
  // focus
  | 'f'
  // focus-visible
  | 'i'
  // hover
  | 'h'
  // active
  | 'a'
  // at-rules
  | 'm';
