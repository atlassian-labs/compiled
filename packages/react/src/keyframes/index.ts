import type { BasicTemplateInterpolations, CSSProps } from '../types';
import { createSetupError } from '../utils/error';

export type KeyframeSteps = string | Record<string, CSSProps<void>>;

/**
 * ## Keyframes
 *
 * Define keyframes to be used in a [CSS animation](https://developer.mozilla.org/en-US/docs/Web/CSS/animation).
 * For further details [read the API documentation](https://compiledcssinjs.com/docs/api-keyframes).
 *
 * ### Style with objects
 *
 * @example
 * ```
 * const fadeOut = keyframes({
 *   from: {
 *     opacity: 1,
 *   },
 *   to: {
 *     opacity: 0,
 *   },
 * });
 *
 * <div css={{ animation: `${fadeOut} 2s` }} />
 * ```
 *
 * ### Style with template literals
 *
 * @example
 * ```
 * const fadeOut = keyframes`
 *   from {
 *     opacity: 1;
 *   }
 *
 *   to {
 *     opacity: 0;
 *   }
 * `;
 *
 * <div css={{ animation: `${fadeOut} 2s` }} />
 * ```
 */
export function keyframes(steps: KeyframeSteps): string;

export function keyframes(
  strings: TemplateStringsArray,
  ...interpolations: BasicTemplateInterpolations[]
): string;

export function keyframes(
  _stringsOrSteps: TemplateStringsArray | KeyframeSteps,
  ..._interpolations: BasicTemplateInterpolations[]
): string {
  throw createSetupError();
}
