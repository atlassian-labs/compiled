/* eslint-disable import/export */

import type { BasicTemplateInterpolations, CSSProps, FunctionInterpolation } from '../types';
import { createSetupError } from '../utils/error';

/**
 * Create styles that can be re-used between components with a template literal.
 *
 * ```
 * css`color: red;`;
 * ```
 *
 * For more help, read the docs:
 * https://compiledcssinjs.com/docs/api-css
 *
 * @param css
 * @param values
 */
export default function css<T = void>(
  _css: TemplateStringsArray,
  ..._values: (BasicTemplateInterpolations | FunctionInterpolation<T>)[]
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
export default function css(_css: CSSProps): CSSProps;

export default function css<T = void>(
  _css: TemplateStringsArray | CSSProps,
  ..._values: (BasicTemplateInterpolations | FunctionInterpolation<T>)[]
): CSSProps {
  throw createSetupError();
}
