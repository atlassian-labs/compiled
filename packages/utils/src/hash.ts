/**
 * Computes the raw 32-bit MurmurHash2 value for a string.
 *
 * This is the shared core used by every encoding variant (`hash`, `hashBase62`).
 * Extracted so all hashing shares a single algorithm — the only difference between
 * variants is how the resulting uint32 is encoded.
 *
 * Taken from https://github.com/garycourt/murmurhash-js/blob/master/murmurhash2_gc.js
 *
 * @param str - the string to hash
 * @param seed - optional seed (default 0)
 * @returns the raw uint32 hash value
 */
function murmur2(str: string, seed = 0): number {
  let l = str.length;
  let h = seed ^ l;
  let i = 0;
  let k;

  while (l >= 4) {
    k =
      (str.charCodeAt(i) & 0xff) |
      ((str.charCodeAt(++i) & 0xff) << 8) |
      ((str.charCodeAt(++i) & 0xff) << 16) |
      ((str.charCodeAt(++i) & 0xff) << 24);

    k = (k & 0xffff) * 0x5bd1e995 + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16);
    k ^= k >>> 24;
    k = (k & 0xffff) * 0x5bd1e995 + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16);
    h = ((h & 0xffff) * 0x5bd1e995 + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;
    l -= 4;

    ++i;
  }

  switch (l) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
    case 1:
      h ^= str.charCodeAt(i) & 0xff;
      h = (h & 0xffff) * 0x5bd1e995 + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16);
  }

  h ^= h >>> 13;
  h = (h & 0xffff) * 0x5bd1e995 + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16);
  h ^= h >>> 15;

  return h >>> 0;
}

/**
 * Quick hash the result of a string input, encoded in base-36 (0-9, a-z).
 *
 * Used for non-class-name purposes: `@keyframes` names, CSS custom property names,
 * cache keys, and asset filenames. Atomic class names use `hashBase62` instead.
 *
 * @param str - the string to hash
 * @param seed - optional seed (default 0)
 */
export function hash(str: string, seed = 0): string {
  return murmur2(str, seed).toString(36);
}

/**
 * Base-62 character set: digits, lowercase, uppercase. Matches the atlaspack SWC
 * transformer's `to_base62` so class names are identical across the babel plugin
 * (CI/prod) and the SWC transformer (local dev), avoiding version-skew mismatches.
 */
const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * The number of characters used for the group hash portion of an atomic class name.
 * 6 chars in base-62 encodes 62^6 = 56.8B values, covering the full 32-bit hash
 * space (4.3B) with zero truncation — eliminating the leading-character bias of the
 * previous base-36 encoding (where 50.7% of values started with '1').
 */
export const ATOMIC_GROUP_HASH_LENGTH = 6;

/**
 * The number of characters used for the value hash portion of an atomic class name.
 * 4 chars in base-62 encodes 62^4 = 14.8M values, sufficient for value deduplication.
 *
 * This is fixed-width so `ax()` can extract the group key with a fast, fixed-offset
 * slice: `className.slice(0, className.length - ATOMIC_VALUE_HASH_LENGTH)`.
 */
export const ATOMIC_VALUE_HASH_LENGTH = 4;

/**
 * Hashes a string and encodes it in base-62 (0-9, a-z, A-Z), zero-padded to a
 * fixed width. Used for atomic class name generation.
 *
 * Produces significantly better collision resistance than the base-36 `hash`:
 * base-62 with 6 characters represents the full 32-bit hash with no truncation,
 * whereas the old base-36 `.slice(0, 4)` collapsed the space to ~93K effective values.
 *
 * @param str - the string to hash
 * @param length - the desired fixed output length (zero-padded)
 * @param seed - optional seed (default 0)
 */
export function hashBase62(str: string, length: number, seed = 0): string {
  let v = murmur2(str, seed);
  let result = '';
  for (let i = 0; i < length; i++) {
    result = BASE62_CHARS[v % 62] + result;
    v = Math.floor(v / 62);
  }
  return result;
}
