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
export const ax = (classes: (string | undefined | false)[]): string => {
  const found: Record<string, string> = {};

  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    if (!cls) {
      continue;
    }

    const group = cls.slice(0, cls.charCodeAt(0) === 95 ? 5 : undefined);
    found[group] = cls;
  }

  return Object.values(found).join(' ');
};
