import { hash, hashBase62, ATOMIC_GROUP_HASH_LENGTH, ATOMIC_VALUE_HASH_LENGTH } from '../hash';

describe('hash', () => {
  it('encodes murmurhash2 output in base-36', () => {
    // Base-36 reference values (unchanged legacy behaviour).
    expect(hash('color')).toBe('1ylxx6h');
    expect(hash('margin')).toBe('1py5azy');
  });

  it('is deterministic', () => {
    expect(hash('display')).toBe(hash('display'));
  });

  it('respects the seed', () => {
    expect(hash('color', 0)).not.toBe(hash('color', 1));
  });
});

describe('hashBase62', () => {
  /**
   * Cross-implementation parity guard.
   *
   * These values MUST match the atlaspack SWC transformer's `to_base62` output
   * (see atlaspack/crates/atlassian-swc-compiled-css). If this test ever fails,
   * class names produced by the babel plugin (CI/prod) and the SWC transformer
   * (local dev) will diverge, silently breaking `ax()` dedup during builds.
   */
  it('matches atlaspack reference values (6-char, full 32-bit hash)', () => {
    expect(hashBase62('color', 6)).toBe('4EWkA1');
    expect(hashBase62('margin', 6)).toBe('45uXpk');
    expect(hashBase62('undefineddefaultcolor', 6)).toBe('2NPkLa');
  });

  it('produces a fixed-width, zero-padded result', () => {
    // Every output must be exactly `length` characters, regardless of the hash magnitude.
    for (const input of ['a', 'color', 'padding-block-start', 'x'.repeat(200)]) {
      expect(hashBase62(input, 6)).toHaveLength(6);
      expect(hashBase62(input, 4)).toHaveLength(4);
    }
  });

  it('only uses base-62 characters (0-9, a-z, A-Z)', () => {
    for (const input of ['color', 'margin', 'display', 'padding']) {
      expect(hashBase62(input, 6)).toMatch(/^[0-9a-zA-Z]+$/);
    }
  });

  it('is deterministic', () => {
    expect(hashBase62('color', 6)).toBe(hashBase62('color', 6));
  });

  it('shares the same underlying murmurhash2 as hash()', () => {
    // hash() base-36 and hashBase62() base-62 are two encodings of the same raw hash.
    // Re-encoding hash()'s base-36 value into base-62 must match hashBase62 (modulo padding).
    const raw = parseInt(hash('color'), 36);
    let expected = '';
    let v = raw;
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < 6; i++) {
      expected = chars[v % 62] + expected;
      v = Math.floor(v / 62);
    }
    expect(hashBase62('color', 6)).toBe(expected);
  });
});

describe('atomic hash length constants', () => {
  it('exports the expected group and value hash lengths', () => {
    expect(ATOMIC_GROUP_HASH_LENGTH).toBe(6);
    expect(ATOMIC_VALUE_HASH_LENGTH).toBe(4);
  });

  it('group hash of 6 base-62 chars covers the full 32-bit hash space', () => {
    // 62^6 = 56,800,235,584 > 2^32 = 4,294,967,296, so no truncation of the hash occurs.
    expect(Math.pow(62, ATOMIC_GROUP_HASH_LENGTH)).toBeGreaterThan(Math.pow(2, 32));
  });
});
