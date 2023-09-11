import type { Pseudos, Properties, AtRules } from 'csstype';

import { createSetupError } from '../utils/error';

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
type CssProps = Readonly<Properties<string | number>>;

type AllPseudos = { [key in `&${Pseudos}`]?: CssProps & WhitelistedPseudo };
// We discourage use of nested selectors (selectors that target child elements)
// such as :first-in-type and :first-child.
type WhitelistedPseudo = Omit<AllPseudos, '&:first-in-type' | '&:first-child'>;

// The `screen and (max-width: 768px)` part of `@media screen and (max-width: 768px)`.
// Ideally we would do type checking to forbid this from containing the `@media` part,
// but TypeScript doesn't provide a good way to do this.
type AtRuleSecondHalf = string;
type WhitelistedAtRule = {
  [atRuleFirstHalf in AtRules]?: {
    [atRuleSecondHalf in AtRuleSecondHalf]: CssProps & WhitelistedPseudo & WhitelistedAtRule;
  };
};
type WhitelistedSelector = WhitelistedPseudo & WhitelistedAtRule;

type ExtendedSelector = { [key: string]: CssProps | ExtendedSelector } & {
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
   *     '@media (min-width: 100px)': {
   *       font-size: '1.5em',
   *     },
   *     '&:hover': {
   *       color: 'pink'
   *     },
   *     selectors: {
   *       '&:not(:active)': {
   *         backgroundColor: 'yellow',
   *       }
   *     },
   *   },
   *   success: {
   *     color: 'green',
   *     '@media (min-width: 100px)': {
   *       font-size: '1.5em'
   *     },
   *     '&:hover': {
   *       color: '#8f8'
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

type Variants<VariantName extends string> = Record<
  VariantName,
  CssProps & WhitelistedSelector & ExtendedSelectors
>;
type ReturnType<VariantName extends string> = Record<VariantName, CssProps>;

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

export default function cssMap<T extends string>(_styles: Variants<T>): Readonly<ReturnType<T>> {
  throw createSetupError();
}
