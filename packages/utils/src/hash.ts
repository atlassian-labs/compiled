/**
 * Quick hash the result of a string input.
 *
 * Taken from https://github.com/garycourt/murmurhash-js/blob/master/murmurhash2_gc.js
 * @param str
 * @param seed
 */
export function hash(str: string, seed = 0): string {
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

  return (h >>> 0).toString(36);
}

/**
 * Base-62 character set: digits 0-9, lowercase a-z, uppercase A-Z.
 * CSS class names are case-sensitive, so using both cases gives 62^N
 * combinations per N characters — 8.8x more space than base-36 for the
 * same class name length.
 */
const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Encodes a non-negative integer as a base-62 string, similar to
 * `Number.toString(36)` but using the full 62-character alphabet
 * (0-9, a-z, A-Z). Returns the shortest representation with no
 * leading zeros, except for the value 0 which returns '0'.
 *
 * CSS class names are case-sensitive, so the uppercase characters
 * are valid and give 62^N combinations per N characters — 8.8x more
 * than base-36 for the same string length.
 *
 * @param n   A non-negative integer
 */
export function toBase62(n: number): string {
  if (n === 0) return '0';
  let result = '';
  while (n > 0) {
    result = BASE62_CHARS[n % 62] + result;
    n = Math.floor(n / 62);
  }
  return result;
}

/**
 * Hashes a string using murmurhash2 and encodes the result as a base-62
 * string, analogous to `hash()` but using the full 62-character alphabet
 * (0-9, a-z, A-Z) instead of base-36. This gives 8.8x more unique values
 * per character, significantly reducing collision probability in atomic CSS
 * class names without increasing string length.
 *
 * @param str   Input string to hash
 * @param seed  Optional murmurhash2 seed (default: 0)
 */
export function hashBase62(str: string, seed = 0): string {
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

  return toBase62(h >>> 0);
}
