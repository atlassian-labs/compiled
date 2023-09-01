import type * as CSS from 'csstype';

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
type CssProps = Readonly<CSS.Properties<string, number>>;

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
type CssObject = Readonly<
  | {
      [key: string]: CssObject;
    }
  | CssProps
>;

type returnType<T extends string> = Record<T, CssProps>;

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

export default function cssMap<T extends string>(
  _styles: Record<T, CssObject>
): Readonly<returnType<T>> {
  throw createSetupError();
}
