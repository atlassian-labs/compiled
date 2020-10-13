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
  if (typeof global === 'undefined') {
    return false;
  }

  if ((globalThis as any) !== global) {
    return false;
  }

  // what if a user did this: `global = globalThis`
  if (typeof window !== 'undefined' && globalThis === window) {
    return false;
  }

  return true;
};
