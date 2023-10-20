import type { Properties, AtRules } from 'csstype';

import type { CSSPseudos } from '../types';
import { createSetupError } from '../utils/error';
import type { CompiledStyles } from '../xcss-prop';

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
type CSSProperties = Readonly<Properties<string | number>>;

type AllPseudos = { [key in CSSPseudos]?: CSSProperties & AllPseudos };

// The `screen and (max-width: 768px)` part of `@media screen and (max-width: 768px)`.
// Ideally we would do type checking to forbid this from containing the `@media` part,
// but TypeScript doesn't provide a good way to do this.
type AtRuleSecondHalf = string;
type WhitelistedAtRule = {
  [atRuleFirstHalf in AtRules]?: {
    [atRuleSecondHalf in AtRuleSecondHalf]: CSSProperties & AllPseudos & WhitelistedAtRule;
  };
};
type WhitelistedSelector = AllPseudos & WhitelistedAtRule;

type ExtendedSelector = { [key: string]: CSSProperties | ExtendedSelector } & {
  /**
   * Using `selectors` is not valid here - you cannot nest a `selectors` object
   * inside another `selectors` object.
   */
  selectors?: never;
};

type ExtendedSelectors = {
  /**
   * Provides a way to use selectors that have not been explicitly whitelisted
   * in cssMap.
   *
   * This does not provide any type-checking for the selectors (thus allowing
   * more expressive selectors), though this is more flexible and allows
   * nesting selectors in other selectors.
   *
   * A selector defined both outside of the `selectors` object and
   * inside the `selectors` object is a runtime error.
   *
   * Note that you cannot nest a `selectors` object inside another
   * `selectors` object.
   *
   * Only use if absolutely necessary.
   *
   * @example
   * ```
   * const myMap = cssMap({
   *   danger: {
   *     color: 'red',
   *     '@media': {
   *       '(min-width: 100px)': {
   *         font-size: '1.5em',
   *       },
   *     },
   *     '&:hover': {
   *       color: 'pink',
   *     },
   *     selectors: {
   *       '&:not(:active)': {
   *         backgroundColor: 'yellow',
   *       }
   *     },
   *   },
   *   success: {
   *     color: 'green',
   *     '@media': {
   *       '(min-width: 100px)': {
   *         font-size: '1.3em',
   *       },
   *     },
   *     '&:hover': {
   *       color: '#8f8',
   *     },
   *     selectors: {
   *       '&:not(:active)': {
   *         backgroundColor: 'white',
   *       }
   *     },
   *   },
   * });
   * ```
   */
  selectors?: ExtendedSelector;
};

/**
 * ## cssMap
 *
 * Creates a collection of named CSS rules that are statically typed and useable with other Compiled APIs.
 * For further details [read the documentation](https://compiledcssinjs.com/docs/api-cssmap).
 *
 * @example
 * ```
 * const borderStyleMap = cssMap({
 *  none: { borderStyle: 'none' },
 *  solid: { borderStyle: 'solid' },
 * });
 * const Component = ({ borderStyle }) => <div css={css(borderStyleMap[borderStyle])} />
 *
 * <Component borderStyle="solid" />
 * ```
 */
export default function cssMap<
  TStyles extends Record<string, CSSProperties & WhitelistedSelector & ExtendedSelectors>
>(
  _styles: TStyles
): {
  readonly [P in keyof TStyles]: CompiledStyles<TStyles[P]> & string;
} {
  throw createSetupError();
}
