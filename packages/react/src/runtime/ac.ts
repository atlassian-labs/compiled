import { isServerEnvironment } from './is-server-environment';

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
  values: Map<string, string>;
  constructor(values: Map<string, string>) {
    // An object stores the relation between Atomic group and actual class name
    // e.g. { "aaaa": "a" } `aaaa` is the Atomic group and `a` is the actual class name
    this.values = values;
  }
  toString() {
    let str = '';

    for (const [, value] of this.values) {
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
export function ac(
  classNames: (AtomicGroups | string | null | undefined | false)[]
): AtomicGroups | undefined {
  // short circuit if there's no class names.
  if (classNames.length <= 1 && !classNames[0]) return undefined;

  const atomicGroups: Map<string, string> = new Map();

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
        atomicGroups.set(
          atomicGroupName,
          isCompressed ? atomic.slice(ATOMIC_GROUP_LENGTH + 1) : atomic
        );
      }
    } else {
      // if cls is an instance of AtomicGroups, transfer its values to `atomicGroups`
      for (const [key, value] of cls.values) {
        atomicGroups.set(key, value);
      }
    }
  }

  return new AtomicGroups(atomicGroups);
}

export function memoizedAc(
  classNames: (AtomicGroups | string | undefined | false)[]
): AtomicGroups | undefined {
  // short circuit if there's no class names.
  if (classNames.length <= 1 && !classNames[0]) return undefined;

  // build the cacheKey based on the function argument
  // e.g. if the argument is ["_aaaabbbb", "_aaaa_a", "some-class-name"],
  // then the cacheKey is "_aaaabbbb _aaaa_a some-class-name"
  let cacheKey = '';
  for (let i = 0; i < classNames.length; i += 1) {
    const current = classNames[i];
    // continue if current is undefined, false, or ""
    if (!current) continue;
    cacheKey += current + ' ';
  }

  cacheKey = cacheKey.slice(0, -1);

  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const result = ac(classNames);

  cache.set(cacheKey, result);

  return result;
}

// Memoization is primarily used to prevent React from unncessary re-rendering.
// Use unmemoizedAc on server-side because We don't need to worry about re-rendering on server-side.
export default isServerEnvironment() ? ac : memoizedAc;

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
