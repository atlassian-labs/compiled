/**
 * Length of the value hash suffix at the end of every atomic class name.
 *
 * Atomic classes have the shape `_<groupHash><valueHash>`, where the value hash
 * is always exactly {@link ATOMIC_VALUE_HASH_LENGTH} chars. This lets us support
 * variable-length group hashes by treating everything before the value suffix as
 * the group key.
 */
const ATOMIC_VALUE_HASH_LENGTH = 4;
const ATOMIC_LEGACY_GROUP_LENGTH = 5;

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

  // Using an object rather than a `Map` as it performed better in our benchmarks.
  // Would be happy to move to `Map` if it proved to be better under real conditions.
  const map: Record<string, string> = {};
  const activeGroupKeysByLegacyPrefix: Record<string, string[]> = {};

  // Two group keys belong to the same prefix family when one fully contains the
  // other from the start. This is how a longer variable-length group hash can
  // override its legacy 4-character ancestor, and vice versa.
  const isSameFamily = (a: string, b: string): boolean => a.startsWith(b) || b.startsWith(a);

  /**
   * Bucketed setter (default).
   *
   * Records the latest atomic class for a group key, replacing any previous
   * class from the same prefix family.
   *
   * Atomic group keys can be either:
   * - legacy: exactly 4 characters after the leading `_` (e.g. `_aaaa`)
   * - variable-length: 4 or more characters (e.g. `_aaaa12`)
   *
   * To support both formats together, we bucket active group keys by their
   * legacy 5-character prefix. Only keys in the same bucket can possibly be in
   * the same prefix family, so we only need to scan a small array per insert
   * instead of the full result map.
   *
   * For runtime performance, the bucket is mutated in place using swap-and-pop
   * so we avoid allocating a fresh array on every insert.
   */
  const setAtomicClassInGroupMapBucketed = (groupKey: string, className: string) => {
    // Find the bucket of group keys that share this legacy prefix.
    const legacyPrefix = groupKey.slice(0, ATOMIC_LEGACY_GROUP_LENGTH);
    const activeGroupKeys = activeGroupKeysByLegacyPrefix[legacyPrefix];

    if (!activeGroupKeys) {
      // First group key seen for this legacy prefix.
      activeGroupKeysByLegacyPrefix[legacyPrefix] = [groupKey];
      map[groupKey] = className;
      return;
    }

    // Drop any keys in the same prefix family so the new key wins.
    // Unrelated keys that just happen to share the legacy prefix are kept
    // (e.g. `_aabbcc` and `_aabbdd` share `_aabb` but are not prefix-family
    // related).
    for (let i = activeGroupKeys.length - 1; i >= 0; i--) {
      const existingGroupKey = activeGroupKeys[i];
      if (isSameFamily(groupKey, existingGroupKey)) {
        delete map[existingGroupKey];
        // Swap-and-pop: O(1) removal that preserves the rest of the bucket.
        activeGroupKeys[i] = activeGroupKeys[activeGroupKeys.length - 1];
        activeGroupKeys.pop();
      }
    }

    activeGroupKeys.push(groupKey);
    map[groupKey] = className;
  };

  /**
   * Simple-scan setter (alternative).
   *
   * Same prefix-family semantics as the bucketed version, but implemented as a
   * direct scan over the full result map. Easier to read, but per-insert cost
   * grows with the total map size rather than the small same-prefix bucket.
   *
   * Useful for comparison benchmarks or as a fallback if the bucketed version
   * ever needs to be disabled.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setAtomicClassInGroupMapSimpleScan = (groupKey: string, className: string) => {
    for (const existingGroupKey in map) {
      if (existingGroupKey.startsWith('_') && isSameFamily(groupKey, existingGroupKey)) {
        delete map[existingGroupKey];
      }
    }
    map[groupKey] = className;
  };

  // Original map setter, doesn't support mix of legacy group key and longer group key
  const setAtomicClassInGroupMapDefault = (groupKey: string, className: string) => {
    map[groupKey] = className;
  };

  const mapStrategy = {
    default: setAtomicClassInGroupMapDefault,
    simple: setAtomicClassInGroupMapSimpleScan,
    bucket: setAtomicClassInGroupMapBucketed,
  };

  // Switch implementation here to compare strategies.
  const setAtomicClassInGroupMap = mapStrategy['bucket'];

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
      const isAtomic = className.startsWith('_');
      const key = isAtomic
        ? className.slice(0, className.length - ATOMIC_VALUE_HASH_LENGTH)
        : className;

      if (isAtomic) {
        // map[key] = className;
        setAtomicClassInGroupMap(key, className);
      } else {
        map[key] = className;
      }
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
