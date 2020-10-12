/**
 * Returns `true` when inside a node environment,
 * else `false`.
 *
 * When using this it will remove any node code from the browser bundle - for example:
 *
 * if (isNodeEnvironment()) {
 *   // This code will be removed from the browser bundle
 * }
 */
export const isNodeEnvironment = () => {
  return (
    Object.prototype.toString.call(typeof process !== undefined ? process : null) ===
    '[object process]'
  );
};
