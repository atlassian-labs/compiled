import type * as CSS from 'csstype';

import type { CSSPseudos, CSSProperties } from '../types.js';
import { createSetupError } from '../utils/error.js';
import type { CompiledStyles } from '../xcss-prop/index.js';

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

type LooseMediaQueries = Record<`@media ${string}`, CSSProperties & AllPseudos>;

/**
 * We remap media query keys to `"@media"` so it's blocked inside the strict APIs.
 * This is done as it's currently impossible to ensure type safety end-to-end — when
 * passing in unknown media queries from the loose API into the strict API you end up
 * being also able to pass any styles you want, which makes the whole point of the strict
 * API meaningless.
 *
 * Sorry folks!
 */
type RemapMedia<TStyles> = {
  [Q in keyof TStyles as Q extends `@media ${string}` ? '@media [loose]' : Q]: TStyles[Q];
};

/**
 * ## CSS Map Scoped
 *
 * A non-atomic alternative to `cssMap`. Instead of splitting each CSS declaration
 * into its own atomic class, `cssMapScoped` groups all declarations for a variant
 * under a single generated CSS class (prefixed `cc-`). This reduces the number of
 * classes applied to a DOM element — particularly useful for large style objects
 * with many nested selectors (e.g. editor or rich-text component styles).
 *
 * The generated class acts as a scope for all nested rules, making it safe to
 * target child elements with class selectors (`.panel`, `.panel-title`, etc).
 *
 * `cssMapScoped` does not accept an options argument — it is always non-atomic.
 *
 * @experimental internal only, use with caution, and intentionally not exported in index.ts for public use.
 * @example
 * ```
 * const styles = cssMapScoped({
 *   panelStyles: {
 *     '.panel': { padding: '8px', backgroundColor: 'blue' },
 *     '.panel-title': { fontWeight: 'bold' },
 *   },
 *   dangerStyles: {
 *     '.panel': { backgroundColor: 'pink' },
 *     '.panel-title': { color: 'red' },
 *   },
 * });
 *
 * <div css={styles.panelStyles} />
 * // → <div class="cc-1vj392m" />
 * ```
 *
 * For further details [read the documentation](https://compiledcssinjs.com/docs/api-cssmap).
 */
export function cssMapScoped<
  TStyles extends Record<
    string,
    CSSProperties & WhitelistedSelector & ExtendedSelectors & LooseMediaQueries
  >
>(
  _styles: TStyles
): {
  readonly [P in keyof TStyles]: CompiledStyles<RemapMedia<TStyles[P]>>;
} {
  throw createSetupError();
}

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
  TStyles extends Record<
    string,
    CSSProperties & WhitelistedSelector & ExtendedSelectors & LooseMediaQueries
  >
>(
  _styles: TStyles
): {
  readonly [P in keyof TStyles]: CompiledStyles<RemapMedia<TStyles[P]>>;
} {
  throw createSetupError();
}
