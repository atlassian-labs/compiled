type Falsy = false | null | undefined | '' | 0;

/**
 * Generally used as opposed to a `Boolean` in a `[].filter` call,
 * which excludes all falsy values in the resulting array.
 *
 * ```
 * [].filter(predicate);
 * ```
 *
 * @param value
 * @returns
 */
export function predicate<T>(value: T): value is Exclude<T, Falsy> {
  return Boolean(value);
}
