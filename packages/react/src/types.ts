import type * as CSS from 'csstype';

/**
 * Typing for the interpolations.
 */
export type BasicTemplateInterpolations = string | number;

export interface FunctionInterpolation<TProps> {
  (props: TProps): CssFunction<TProps>;
}

/**
 * These are all the CSS props that will exist.
 */
export type CSSProps<TProps> = CSS.Properties<CssFunction<TProps>>;

export type CssObject<TProps> = {
  [key: string]: CssFunction<TProps>;
};

export type CssFunction<TProps = unknown> =
  | CSSProps<TProps> // Typed CSS properties
  | CssObject<TProps> // CSS object
  | FunctionInterpolation<TProps> // Props provider usage
  | BasicTemplateInterpolations // CSS values in tagged template expression
  | string // Plain css string
  | boolean // Something like `false && styles`
  | undefined; // Something like `undefined && styles`
