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
export default function ax(
  classNames: (string | undefined | false | string[])[]
): string | undefined {
  if (classNames.length <= 1 && (!classNames[0] || classNames[0].indexOf(' ') === -1)) {
    // short circuit if there's no custom class names.
    if (!classNames[0]) return undefined;
    if (Array.isArray(classNames[0])) return classNames[0][1];
    if (classNames[0].indexOf(' ') === -1) return classNames[0];
  }

  const atomicGroups: Record<string, string> = {};

  for (let i = 0; i < classNames.length; i++) {
    const cls = classNames[i];
    if (!cls) {
      continue;
    }

    const groups = Array.isArray(cls) ? [cls] : cls.split(' ');

    for (let x = 0; x < groups.length; x++) {
      const atomic = groups[x];

      if (Array.isArray(atomic)) {
        const atomicGroupName = atomic[0];
        atomicGroups[`_${atomicGroupName}`] = atomic[1];
      } else {
        const atomicGroupName = atomic.slice(
          0,
          atomic.charCodeAt(0) === UNDERSCORE_UNICODE ? ATOMIC_GROUP_LENGTH : undefined
        );
        atomicGroups[atomicGroupName] = atomic;
      }
    }
  }

  let str = '';

  for (const key in atomicGroups) {
    const value = atomicGroups[key];
    str += value + ' ';
  }

  return str.slice(0, -1);
}
