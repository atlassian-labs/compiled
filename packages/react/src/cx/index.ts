import type { XCSSProp } from '../xcss/xcss-prop';

/**
 * __cx__
 *
 * This function is a utlitiy used to compose xcss fns together.
 * There is no runtime, it is fully extracted at compile time.
 *
 * @example
 * ```tsx
 * const style = cx(
 *   xcss({
 *     color: 'red',
 *   }),
 *   xcss({
 *     '&:active': {
 *        color: 'red',
 *     }
 *   })
 * )
 * ```
 *
 * Which would be equivalent to:
 *
 * ```tsx
 * const style = xcss({
 *   color: 'red',
 *   '&:active': {
 *     color: 'red',
 *   }
 * })
 * ```
 */
const cx = <Collection extends [...XCSSProp<any, any>[]]>(
  ..._css: Collection
): Collection[number] => {
  /** hack to allow testing - ideally use prod only error */
  return _css[0];
};

export default cx;
