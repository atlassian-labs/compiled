/**
 * The length of the value hash portion of an atomic class name.
 * Atomic class names have the format: `_<group><value>`
 * where group is ATOMIC_GROUP_HASH_LENGTH chars and value is ATOMIC_VALUE_HASH_LENGTH chars.
 *
 * We extract the group key using: `className.slice(0, className.length - ATOMIC_VALUE_HASH_LENGTH)`
 *
 * We support both old-format classes (9 chars: `_` + 4 group + 4 value) and
 * new-format classes (11 chars: `_` + 6 group + 4 value) by using length-based
 * extraction rather than a hardcoded offset — old and new format group keys
 * are different lengths so they are structurally disjoint and never alias each other.
 */
const ATOMIC_VALUE_HASH_LENGTH = 4;

/**
 * Create a single string containing all the classnames provided, separated by a space (`" "`).
 * The result will only contain the _last_ atomic style classname for each atomic `group`.
 *
 * ```ts
 * ax(['_aaaaaabbbb', '_aaaaaacccc']);
 * // output
 * '_aaaaaacccc'
 * ```
 *
 * Format of Atomic style classnames: `_{group}{value}` (`_\w{4}\w{4}`)
 *
 * `ax` will preserve any non atomic style classnames (eg `"border-red"`)
 *
 * ```ts
 * ax(['_aaaaaabbbb', '_aaaaaacccc', 'border-red']);
 * // output
 * '_aaaaaacccc border-red'
 * ```
 */
export default function ax(classNames: (string | undefined | null | false)[]): string | undefined {
  // Shortcut: nothing to do
  if (!classNames.length) {
    return;
  }

  // Shortcut: don't need to do anything if we only have a single classname
  if (
    classNames.length === 1 &&
    classNames[0] &&
    // checking to see if `classNames[0]` is a string that contains other classnames
    !classNames[0].includes(' ')
  ) {
    return classNames[0];
  }

  // Using an object rather than a `Map` as it performed better in our benchmarks.
  // Would be happy to move to `Map` if it proved to be better under real conditions.
  const map: Record<string, string> = {};

  // Note: using loops to minimize iterations over the collection
  for (const value of classNames) {
    // Exclude all falsy values, which leaves us with populated strings
    if (!value) {
      continue;
    }

    // a `value` can contain multiple classnames
    const list = value.split(' ');

    for (const className of list) {
      /**
       * For atomic style classnames: the `key` is the `group`
       *
       * - Later atomic classnames with the same `group` will override earlier ones
       *   (which is what we want).
       * - Assumes atomic classnames are the only things that start with `_`
       * - Could use a regex to ensure that atomic classnames are structured how we expect,
       *   but did not add that for now as it did slow things down a bit.
       *
       * For other classnames: the `key` is the whole classname
       * - Okay to remove duplicates as doing so does not impact specificity
       *
       * */
      const key = className.startsWith('_')
        ? className.slice(0, className.length - ATOMIC_VALUE_HASH_LENGTH)
        : className;
      map[key] = className;
    }
  }

  /**
   * We are converting the `map` into a string.
   *
   * The simple way to do this would be `Object.values(map).join(' ')`.
   * However, the approach below performs 10%-20% better in benchmarks.
   *
   * For `ax()` it feels right to squeeze as much runtime performance out as we can.
   */
  let result: string = '';
  for (const key in map) {
    result += map[key] + ' ';
  }

  // If we have an empty string, then our `map` was empty.
  if (!result) {
    return;
  }

  // remove last " " from the result (we added " " at the end of every value)
  return result.trimEnd();
}
