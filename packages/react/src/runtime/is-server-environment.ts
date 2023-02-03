/**
 * @see https://github.com/jsdom/jsdom/releases/tag/12.0.0
 * @see https://github.com/jsdom/jsdom/issues/1537
 */
const isJsDomEnvironment = () =>
  window.name === 'nodejs' ||
  navigator?.userAgent.includes('Node.js') ||
  navigator?.userAgent.includes('jsdom');
/**
 * Returns `true` when inside a node environment,
 * else `false`.
 *
 * When using this it will remove any node code from the browser bundle - for example:
 *
 * ```js
 * if (isServerEnvironment()) {
 *   // This code will be removed from the browser bundle
 * }
 * ```
 */
export const isServerEnvironment = (): boolean => {
  if (
    typeof window === 'undefined' ||
    (typeof process !== 'undefined' && process.versions != null && process.versions.node != null)
  ) {
    return true;
  }
  if (isJsDomEnvironment()) {
    return true;
  }
  return false;
};
