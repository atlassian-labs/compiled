/**
 * Returns `true` when caching should be disabled, else `false`.
 *
 * Any code within this check will be removed in the output bundles:
 *
 * ```js
 * if (isCacheDisabled()) {
 *   // This code will be removed from the output bundles
 * }
 * ```
 */
export const isCacheDisabled = (): boolean => {
  return process.env.NODE_ENV === 'test' && process.env.CACHE === 'false';
};
