import type * as CSS from 'csstype';

/**
 * Typing for the interpolations.
 */
export type BasicTemplateInterpolations = string | number;

export interface FunctionInterpolation<TProps> {
  (props: TProps): CssFunction<TProps>;
}

/**
 * Possible types for a CSS value
 */
export type CssType<TProps> =
  | CSSProps<TProps> // Typed CSS properties
  | CssObject<TProps> // CSS object
  | FunctionInterpolation<TProps> // Props provider usage
  | string; // Plain css string

/**
 * These are all the CSS props that will exist.
 */
export type CSSProps<TProps> = Readonly<CSS.Properties<CssFunction<TProps>>>;

export type CssObject<TProps> = Readonly<{
  [key: string]: CssFunction<TProps>;
}>;

// CSS inside of a CSS expression
export type CssFunction<TProps = unknown> =
  | CssType<TProps>
  | BasicTemplateInterpolations // CSS values in tagged template expression
  | boolean // Something like `false && styles`
  | undefined; // Something like `undefined && styles`
