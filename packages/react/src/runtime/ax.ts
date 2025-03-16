/**
 * This length includes the underscore,
 * e.g. `"_1s4A"` would be a valid atomic group hash.
 */
const ATOMIC_GROUP_LENGTH = 5;

/**
 * Create a classname string which contains only a _single_ classname for each atomic _group_, and that the _last_ atomic definition _value_ remains.
 *
 * ```ts
 * ax(['_aaaabbbb', '_aaaacccc']);
 * // output
 * '_aaaacccc'
 * ```
 *
 * **Notes**
 * - Atomic style declarations take the form of `_{group}{value}`, where `group` and `value` are four characters long
 * - This function will preserve any non atomic style declarations (eg "my-cool-class")
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

  // Map<Group, Value>
  const map = new Map<string, string>();

  for (const value of classNames) {
    // Exclude all falsy values, which leaves us with populated strings
    if (!value) {
      continue;
    }

    // a `value` can contain multiple classnames
    const list = value.split(' ');

    for (const className of list) {
      /**
       * For atomic style declarations: the `key` is the `group`
       *
       * - Later entries for a `group` will override earlier ones (which is what we want).
       * - Assumes atomic declarations are the only things that start with `_`
       * - Could use a Regex to ensure that atomic declarations are structured how we expect,
       *   but did not add that for now as it did slow things down a bit.
       *
       * For other classnames: the `key` is the whole classname
       * - Okay to remove duplicates as doing so does not impact specificity
       *
       * */
      const key = className.startsWith('_') ? className.slice(0, ATOMIC_GROUP_LENGTH) : className;
      map.set(key, className);
    }
  }

  if (!map.size) {
    return;
  }

  // Return all our classnames as a single string, with all classnames separated by a space
  return Array.from(map.values()).join(' ');
}
