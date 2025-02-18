import type { BasicTemplateInterpolations, CSSProps } from '../types';
import { createSetupError } from '../utils/error';

export type KeyframeSteps =
  // `string` would just be an arbitrary CSS-like string such as `keyframes('from{opacity:1;}to{opacity:0;}')`
  | string
  | Record<
      'from' | 'to' | string,
      // We allow basically all CSSProperties here and CSS Variables mapping to their values.
      // eg. `{ display: 'block', '--var': 'block' }` — but likely it just becomes `'--var': any`
      CSSProps<void> | { [key: `--${string}`]: CSSProps<void>[keyof CSSProps<void>] }
    >;

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
