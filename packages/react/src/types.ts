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
  | null
  | boolean // Something like `false && styles`
  | undefined; // Something like `undefined && styles`

// List of pseudo-classes and pseudo-elements are from csstype
// but with & added in the front, so that we target the current element
// (instead of a child element)

// We also exclude anything that requires providing an argument
// (e.g. &:not(...) ), and anything that uses information from elements
// outside of the current element (e.g. &:first-of-type)
export type CSSPseudos =
  | '&::after'
  | '&::backdrop'
  | '&::before'
  | '&::cue'
  | '&::cue-region'
  | '&::first-letter'
  | '&::first-line'
  | '&::grammar-error'
  | '&::marker'
  | '&::placeholder'
  | '&::selection'
  | '&::spelling-error'
  | '&::target-text'
  | '&::view-transition'
  | '&:active'
  | '&:autofill'
  | '&:blank'
  | '&:checked'
  | '&:default'
  | '&:defined'
  | '&:disabled'
  | '&:empty'
  | '&:enabled'
  | '&:first'
  | '&:focus'
  | '&:focus-visible'
  | '&:focus-within'
  | '&:fullscreen'
  | '&:hover'
  | '&:in-range'
  | '&:indeterminate'
  | '&:invalid'
  | '&:left'
  | '&:link'
  | '&:local-link'
  | '&:optional'
  | '&:out-of-range'
  | '&:paused'
  | '&:picture-in-picture'
  | '&:placeholder-shown'
  | '&:playing'
  | '&:read-only'
  | '&:read-write'
  | '&:required'
  | '&:right'
  | '&:target'
  | '&:user-invalid'
  | '&:user-valid'
  | '&:valid'
  | '&:visited';
