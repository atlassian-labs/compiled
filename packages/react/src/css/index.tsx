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
export default function css<T = void>(
  styles: TemplateStringsArray,
  ...interpolations: (BasicTemplateInterpolations | FunctionInterpolation<T>)[]
): CSSProps;

export default function css(styles: AnyKeyCssProps<void> | CSSProps): CSSProps;

export default function css<T = void>(
  _styles: TemplateStringsArray | CSSProps,
  ..._interpolations: (BasicTemplateInterpolations | FunctionInterpolation<T>)[]
): CSSProps {
  throw createSetupError();
}
