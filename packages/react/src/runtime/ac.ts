const UNDERSCORE_UNICODE = 95;

/**
 * This length includes the underscore,
 * e.g. `"_1s4A"` would be a valid atomic group hash.
 */
const ATOMIC_GROUP_LENGTH = 5;

/**
 * Memoize the result of ac so if it is called with the same args, it returns immediately.
 * Also, to prevent useless React rerenders
 */
const cache = new Map();

/**
 * `ac` returns an instance of AtomicGroups. The instance holds the knowledge of Atomic Group so we can chain `ac`.
 * e.g. <div className={ax([ax(['_aaaa_b']), '_aaaa_c'])} />
 */
class AtomicGroups {
  values: Record<string, string> | undefined;
  cacheKey: string;
  constructor(values: Record<string, string>, cacheKey: string) {
    // An object stores the relation between Atomic group and actual class name
    // e.g. { "aaaa": "a" } `aaaa` is the Atomic group and `a` is the actual class name
    this.values = values;
    // e.g. A unique identifier of the AtomicGroups.
    // e.g. If this.values is { "aaaa": "a", "bbbb": "b" }, this.cacheKey is "_aaaa_a_bbbb_b"
    this.cacheKey = cacheKey;
  }
  toString() {
    let str = '';

    for (const key in this.values) {
      const value = this.values[key];
      str += value + ' ';
    }

    return str.slice(0, -1);
  }
}

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
export default function ac(
  classNames: (AtomicGroups | string | undefined | false)[]
): AtomicGroups | undefined {
  // short circuit if there's no class names.
  if (classNames.length <= 1 && !classNames[0]) return undefined;

  // build the cacheKey based on the function argument
  // e.g. if the argument is ["_aaaabbbb", "_aaaa_a", "some-class-name"],
  // then the cacheKey is "_aaaabbbb_aaaa_asome-class-name"
  const cacheKey = classNames.reduce((accumulator: string, currentValue) => {
    // if current is undefined, false, or ""
    if (!currentValue) return accumulator;
    if (typeof currentValue === 'string') {
      return accumulator + currentValue;
    }
    return accumulator + currentValue.cacheKey;
  }, '');

  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const atomicGroups: Record<string, string> = {};

  for (let i = 0; i < classNames.length; i++) {
    const cls = classNames[i];
    if (!cls) {
      continue;
    }

    if (typeof cls === 'string') {
      const groups = cls.split(' ');

      for (let x = 0; x < groups.length; x++) {
        const atomic = groups[x];
        const isAtomic = atomic.charCodeAt(0) === UNDERSCORE_UNICODE;
        const isCompressed = isAtomic && atomic.charCodeAt(5) === UNDERSCORE_UNICODE;

        const atomicGroupName = isAtomic ? atomic.slice(0, ATOMIC_GROUP_LENGTH) : atomic;
        atomicGroups[atomicGroupName] = isCompressed
          ? atomic.slice(ATOMIC_GROUP_LENGTH + 1)
          : atomic;
      }
    } else {
      // if cls is an instance of AtomicGroups, transfer its values to `atomicGroups`
      for (const key in cls.values) {
        atomicGroups[key] = cls.values[key];
      }
    }
  }

  const result = new AtomicGroups(atomicGroups, cacheKey);

  cache.set(cacheKey, result);

  return result;
}

/**
 * Provide an opportunity to clear the cache to prevent memory leak.
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Expose cache
 */
export function getCache(): typeof cache {
  return cache;
}
