/* eslint-disable import/export */

import type { CSSProps, CssObject, CssFunction } from '../types';
import { createSetupError } from '../utils/error';

/**
 * ## CSS
 *
 * Create styles that are statically typed and useable with other Compiled APIs.
 * For further details [read the documentation](https://compiledcssinjs.com/docs/api-css).
 *
 * This API does not currently work with XCSS prop.
 *
 * ### Style with objects
 *
 * @example
 * ```
 * const redText = css({
 *   color: 'red',
 * });
 *
 * <div css={redText} />
 * ```
 *
 * ### Style with template literals
 *
 * @example
 * ```
 * const redText = css`
 *   color: red;
 * `;
 *
 * <div css={redText} />
 * ```
 */
export default function css<TProps = unknown>(
  styles: TemplateStringsArray,
  ...interpolations: CssFunction<TProps>[]
): CSSProps<TProps>;

export default function css<T = unknown>(
  styles: CssObject<T> | CssObject<T>[] | CSSProps<T> | CSSProps<T>[]
): CSSProps<T>;

export default function css<T = unknown>(
  _styles: TemplateStringsArray | CssObject<T> | CssObject<T>[],
  ..._interpolations: CssFunction[]
): CSSProps<T> {
  throw createSetupError();
}
