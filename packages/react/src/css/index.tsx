import { createSetupError } from '../utils/error';
import type { CssFunction, CSSProps } from '../types';

/**
 * Create styles that can be re-used between components.
 *
 * ```
 * css`color: red;`;
 * css({ color: 'red' });
 * css(`color: red`);
 * ```
 *
 * For more help, read the docs:
 * https://compiledcssinjs.com/docs/api-css
 *
 * @param css
 */
export default function css(_css: CssFunction): CSSProps {
  throw createSetupError();
}
