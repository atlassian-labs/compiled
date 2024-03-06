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

export type CSSPseudoElements =
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
  | '&::view-transition';

export type CSSPseudoClasses =
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

/*
 * This list of pseudo-classes and pseudo-elements are from csstype
 * but with & added to the front. Compiled supports both &-ful
 * and &-less forms and both will target the current element
 * (`&:hover` <==> `:hover`), however we force the use of the
 * &-ful form for consistency with the nested spec for new APIs.
 */
export type CSSPseudos = CSSPseudoElements | CSSPseudoClasses;

/**
 * The XCSSProp must be given all known available properties even
 * if it takes a subset of them. This ensures the (lack-of an)
 * excess property check doesn't enable makers to circumvent the
 * system and pass in values they shouldn't.
 */
export type CSSProperties = Readonly<CSS.Properties<(string & object) | number>>;

/**
 * A stricter subset of the {@link CSSProperties} type that excludes
 * vendor and obsolete properties.
 */
export type StrictCSSProperties = Readonly<CSS.StandardProperties & CSS.SvgProperties>;
