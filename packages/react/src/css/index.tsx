import { createSetupError } from '../utils/error';
import type { CSSProps } from '../types';

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
export default function css(_css: TemplateStringsArray, ..._values: (string | number)[]): CSSProps;

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

export default function css(
  _css: TemplateStringsArray | CSSProps,
  ..._values: (string | number)[]
): CSSProps {
  throw createSetupError();
}
