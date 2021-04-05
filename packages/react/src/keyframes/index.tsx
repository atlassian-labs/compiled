import { createSetupError } from '../utils/error';
import type { CssFunction } from '../types';

/**
 * Create keyframes that can be re-used between components.
 *
 * ```jsx
 * const fadeIn = keyframes`
 *   from { opacity: 0 }
 *   to { opacity: 1 }
 * `;
 *
 * const fadeIn = keyframes({
 *   from: { opacity: 0 },
 *   to: { opacity: 1 },
 * });
 * ```
 *
 * For more help, read the docs:
 * https://compiledcssinjs.com/docs/api-keyframes
 *
 * @param css
 */
export function keyframes(_keyframes: CssFunction): string {
  throw createSetupError();
}
