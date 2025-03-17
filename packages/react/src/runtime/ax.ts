/**
 * This length includes the underscore,
 * e.g. `"_1s4A"` would be a valid atomic group hash.
 */
const ATOMIC_GROUP_LENGTH = 5;

/**
 * Create a single string containing all the classnames provided, separated by a space (`" "`).
 * The result will only contain the _last_ atomic style classname for each atomic `group`.
 *
 * ```ts
 * ax(['_aaaabbbb', '_aaaacccc']);
 * // output
 * '_aaaacccc'
 * ```
 *
 * Format of Atomic style classnames: `_{group}{value}` (`_\w{4}\w{4}`)
 *
 * `ax` will preserve any non atomic style classnames (eg `"border-red"`)
 *
 * ```ts
 * ax(['_aaaabbbb', '_aaaacccc', 'border-red']);
 * // output
 * '_aaaacccc border-red'
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
      const key = className.startsWith('_') ? className.slice(0, ATOMIC_GROUP_LENGTH) : className;
      map[key] = className;
      // map.set(key, className);
    }
  }

  if (!map.size) {
    return;
  }

  // Return all our classnames as a single string, with all classnames separated by a space
  // return Array.from(map.values()).join(' ');
  return Object.values(map).join(' ');
}
