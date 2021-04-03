import { createSetupError } from '../utils/error';
import type { CSSProps } from '../types';

/**
 * Create styles that can be re-used between components.
 *
 * ```
 * css`color: red;`;
 * ```
 *
 * For more help, read the docs:
 * https://compiledcssinjs.com/docs/api-css
 *
 * @param css
 */
export default function css(_css: TemplateStringsArray): CSSProps {
  throw createSetupError();
}
