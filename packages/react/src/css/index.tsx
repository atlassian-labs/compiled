/* eslint-disable import/export */

import type {
  AnyKeyCssProps,
  BasicTemplateInterpolations,
  CSSProps,
  FunctionInterpolation,
} from '../types';
import { createSetupError } from '../utils/error';

/**
 * ## CSS
 *
 * Define styles that are statically typed and useable with other Compiled APIs.
 * For further details [read the documentation](https://compiledcssinjs.com/docs/api-css).
 *
 * ### Style with template literals
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
 * ### Style with objects
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
export default function css<T = void>(
  styles: TemplateStringsArray,
  ...interpolations: (BasicTemplateInterpolations | FunctionInterpolation<T>)[]
): CSSProps;

/**
 * Create styles that can be re-used between components with an object
 *
 * ```
 * css({ color: 'red' });
 * ```
 *
 * For more help, read the docs:
 * https://compiledcssinjs.com/docs/api-css
 *
 * @param css
 */
export default function css(styles: AnyKeyCssProps<void> | CSSProps): CSSProps;

export default function css<T = void>(
  _styles: TemplateStringsArray | CSSProps,
  ..._interpolations: (BasicTemplateInterpolations | FunctionInterpolation<T>)[]
): CSSProps {
  throw createSetupError();
}
