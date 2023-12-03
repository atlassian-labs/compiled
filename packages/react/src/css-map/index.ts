import type * as CSS from 'csstype';

import type { CSSPseudos, CSSProperties } from '../types';
import { createSetupError } from '../utils/error';
import type { CompiledStyles } from '../xcss-prop';

type AllPseudos = { [key in CSSPseudos]?: CSSProperties & AllPseudos };

// The `screen and (max-width: 768px)` part of `@media screen and (max-width: 768px)`.
// Ideally we would do type checking to forbid this from containing the `@media` part,
// but TypeScript doesn't provide a good way to do this.
type AtRuleSecondHalf = string;
type WhitelistedAtRule = {
  [atRuleFirstHalf in CSS.AtRules]?: {
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
 * ## CSS Map
 *
 * Creates a collection of named styles that are statically typed and useable with other Compiled APIs.
 * For further details [read the documentation](https://compiledcssinjs.com/docs/api-cssmap).
 *
 * @example
 * ```
 * const styles = cssMap({
 *  none: { borderStyle: 'none' },
 *  solid: { borderStyle: 'solid' },
 * });
 *
 * <div css={styles.solid} />
 * ```
 */
export default function cssMap<
  TStyles extends Record<string, CSSProperties & WhitelistedSelector & ExtendedSelectors>
>(
  _styles: TStyles
): {
  readonly [P in keyof TStyles]: CompiledStyles<TStyles[P]>;
} {
  throw createSetupError();
}
