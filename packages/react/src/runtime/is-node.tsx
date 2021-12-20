/**
 * Returns `true` when inside a node environment,
 * else `false`.
 *
 * When using this it will remove any node code from the browser bundle - for example:
 *
 * ```js
 * if (isNodeEnvironment()) {
 *   // This code will be removed from the browser bundle
 * }
 * ```
 */
export const isNodeEnvironment = (): boolean => {
  return typeof window === 'undefined';
};
