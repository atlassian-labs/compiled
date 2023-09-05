import { type Properties } from 'csstype';

import { createSetupError } from '../utils/error';

type CSSVarFunction = `var(--${string})` | `var(--${string}, ${string | number})`;
type Primitive = string | boolean | number | null | undefined;

declare const simplePseudoMap: {
  readonly ':-moz-any-link': true;
  readonly ':-moz-full-screen': true;
  readonly ':-moz-placeholder': true;
  readonly ':-moz-read-only': true;
  readonly ':-moz-read-write': true;
  readonly ':-ms-fullscreen': true;
  readonly ':-ms-input-placeholder': true;
  readonly ':-webkit-any-link': true;
  readonly ':-webkit-full-screen': true;
  readonly '::-moz-placeholder': true;
  readonly '::-moz-progress-bar': true;
  readonly '::-moz-range-progress': true;
  readonly '::-moz-range-thumb': true;
  readonly '::-moz-range-track': true;
  readonly '::-moz-selection': true;
  readonly '::-ms-backdrop': true;
  readonly '::-ms-browse': true;
  readonly '::-ms-check': true;
  readonly '::-ms-clear': true;
  readonly '::-ms-fill': true;
  readonly '::-ms-fill-lower': true;
  readonly '::-ms-fill-upper': true;
  readonly '::-ms-reveal': true;
  readonly '::-ms-thumb': true;
  readonly '::-ms-ticks-after': true;
  readonly '::-ms-ticks-before': true;
  readonly '::-ms-tooltip': true;
  readonly '::-ms-track': true;
  readonly '::-ms-value': true;
  readonly '::-webkit-backdrop': true;
  readonly '::-webkit-input-placeholder': true;
  readonly '::-webkit-progress-bar': true;
  readonly '::-webkit-progress-inner-value': true;
  readonly '::-webkit-progress-value': true;
  readonly '::-webkit-resizer': true;
  readonly '::-webkit-scrollbar-button': true;
  readonly '::-webkit-scrollbar-corner': true;
  readonly '::-webkit-scrollbar-thumb': true;
  readonly '::-webkit-scrollbar-track-piece': true;
  readonly '::-webkit-scrollbar-track': true;
  readonly '::-webkit-scrollbar': true;
  readonly '::-webkit-slider-runnable-track': true;
  readonly '::-webkit-slider-thumb': true;
  readonly '::after': true;
  readonly '::backdrop': true;
  readonly '::before': true;
  readonly '::cue': true;
  readonly '::first-letter': true;
  readonly '::first-line': true;
  readonly '::grammar-error': true;
  readonly '::placeholder': true;
  readonly '::selection': true;
  readonly '::spelling-error': true;
  readonly ':active': true;
  readonly ':after': true;
  readonly ':any-link': true;
  readonly ':before': true;
  readonly ':blank': true;
  readonly ':checked': true;
  readonly ':default': true;
  readonly ':defined': true;
  readonly ':disabled': true;
  readonly ':empty': true;
  readonly ':enabled': true;
  readonly ':first': true;
  readonly ':first-child': true;
  readonly ':first-letter': true;
  readonly ':first-line': true;
  readonly ':first-of-type': true;
  readonly ':focus': true;
  readonly ':focus-visible': true;
  readonly ':focus-within': true;
  readonly ':fullscreen': true;
  readonly ':hover': true;
  readonly ':in-range': true;
  readonly ':indeterminate': true;
  readonly ':invalid': true;
  readonly ':last-child': true;
  readonly ':last-of-type': true;
  readonly ':left': true;
  readonly ':link': true;
  readonly ':only-child': true;
  readonly ':only-of-type': true;
  readonly ':optional': true;
  readonly ':out-of-range': true;
  readonly ':placeholder-shown': true;
  readonly ':read-only': true;
  readonly ':read-write': true;
  readonly ':required': true;
  readonly ':right': true;
  readonly ':root': true;
  readonly ':scope': true;
  readonly ':target': true;
  readonly ':valid': true;
  readonly ':visited': true;
};
type SimplePseudos = keyof typeof simplePseudoMap;

interface ContainerProperties {
  container?: string;
  containerType?: 'size' | 'inline-size' | (string & NonNullable<unknown>);
  containerName?: string;
}
type CSSTypeProperties = Properties<number | (string & NonNullable<unknown>)> & ContainerProperties;
type CSSProperties = {
  [Property in keyof CSSTypeProperties]:
    | CSSTypeProperties[Property]
    | CSSVarFunction
    | (CSSVarFunction | CSSTypeProperties[Property])[];
};
type PseudoProperties = {
  [key in SimplePseudos]?: CSSProperties;
};
type CSSPropertiesAndPseudos = CSSProperties & PseudoProperties;
type Query<Key extends string, StyleType> = {
  [key in Key]?: {
    [query: string]: Omit<StyleType, Key>;
  };
};
type MediaQueries<StyleType> = Query<'@media', StyleType>;
type FeatureQueries<StyleType> = Query<'@supports', StyleType>;
type ContainerQueries<StyleType> = Query<'@container', StyleType>;
type Layers<StyleType> = Query<'@layer', StyleType>;
interface AllQueries<StyleType>
  extends MediaQueries<StyleType & AllQueries<StyleType>>,
    FeatureQueries<StyleType & AllQueries<StyleType>>,
    ContainerQueries<StyleType & AllQueries<StyleType>>,
    Layers<StyleType & AllQueries<StyleType>> {}
type WithQueries<StyleType> = StyleType & AllQueries<StyleType>;

type StyleRule = CSSPropertiesAndPseudos & WithQueries<CSSPropertiesAndPseudos>;

/**
 * These are all the CSS props that will exist.
 * Only 'string' and 'number' are valid CSS values.
 *
 * @example
 * ```
 * const style: CssProps = {
 *  color: 'red',
 *  margin: 10,
 * };
 * ```
 */

/**
 * Recursively typed CSS object because nested objects are allowed.
 *
 * @example
 * ```
 * const style: CssObject = {
 *  "@media screen and (min-width: 480px)": {
 *    ":hover": {
 *      color: 'red'
 *   }
 *  }
 * }
 * ```
 */
type Variant<T extends string> = Record<T, StyleRule>;

/**
 * ## cssMap
 *
 * Creates a collection of named CSS rules that are statically typed and useable with other Compiled APIs.
 * For further details [read the documentation](https://compiledcssinjs.com/docs/api-cssmap).
 *
 * @example
 * ```
 * const borderStyleMap = cssMap({
 *     none: { borderStyle: 'none' },
 *     solid: { borderStyle: 'solid' },
 * });
 * const Component = ({ borderStyle }) => <div css={css(borderStyleMap[borderStyle])} />
 *
 * <Component borderStyle="solid" />
 * ```
 */

export default function cssMap<T extends string>(_styles: Variant<T>): any {
  throw createSetupError();
}
