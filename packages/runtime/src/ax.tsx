const UNDERSCORE_UNICODE = 95;

/**
 * This length includes the underscore,
 * e.g. `"_1s4A"` would be a valid atomic group hash.
 */
const ATOMIC_GROUP_LENGTH = 5;

/**
 * Joins classes together and ensures atomic declarations of a single group exist.
 * Atomic declarations take the form of `_{group}{value}` (always prefixed with an underscore),
 * where both `group` and `value` are hashes **four characters long**.
 * Class names can be of any length,
 * this function can take both atomic declarations and class names.
 *
 * Input:
 *
 * ```
 * ax(['_aaaabbbb', '_aaaacccc'])
 * ```
 *
 * Output:
 *
 * ```
 * '_aaaacccc'
 * ```
 *
 * @param classes
 */
export default function ax(classNames: (string | undefined | false)[]): string {
  const atomicGroups: Record<string, string> = {};
  let i = -1;

  while (++i < classNames.length) {
    if (!classNames[i]) {
      continue;
    }

    const groups = (classNames[i] as string).split(' ');
    let x = -1;

    while (++x < groups.length) {
      atomicGroups[
        groups[x].slice(
          0,
          groups[x].charCodeAt(0) === UNDERSCORE_UNICODE ? ATOMIC_GROUP_LENGTH : undefined
        )
      ] = groups[x];
    }
  }

  return Object.values(atomicGroups).join(' ');
}
