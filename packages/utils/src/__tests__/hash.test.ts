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

describe('collision resistance', () => {
  /**
   * Builds a realistic corpus of atomic group keys of the form
   * `${property}${value}` mirroring how `atomicify-rules` hashes rules.
   */
  const buildGroupKeys = (): string[] => {
    const properties = [
      'color',
      'background-color',
      'border-color',
      'border-top-color',
      'border-left-width',
      'margin-top',
      'margin-left',
      'padding-top',
      'padding-left',
      'font-size',
      'line-height',
      'display',
      'position',
      'top',
      'left',
      'width',
      'height',
      'z-index',
      'opacity',
      'flex-grow',
    ];
    const keys: string[] = [];
    for (const property of properties) {
      for (let i = 0; i < 300; i++) {
        // Vary both the pseudo/at-rule context and the value.
        keys.push(`:hover${property}`);
        keys.push(`@media screen${property}${i}px`);
        keys.push(`${property}${i}`);
      }
    }
    return keys;
  };

  const countCollisions = (hashes: string[]): number => {
    const seen = new Map<string, string>();
    let collisions = 0;
    for (const [i, h] of hashes.entries()) {
      const existing = seen.get(h);
      // A collision only counts when two DIFFERENT inputs share a hash.
      if (existing !== undefined && existing !== String(i)) collisions++;
      else seen.set(h, String(i));
    }
    return collisions;
  };

  it('base-62 6-char group produces far fewer collisions than legacy base-36 4-char', () => {
    const keys = buildGroupKeys();

    const legacyGroups = keys.map((k) => hash(k).slice(0, 4));
    const base62Groups = keys.map((k) => hashBase62(k, 6));

    // Deduplicate identical inputs first — only distinct inputs can be a real collision.
    const distinctKeys = Array.from(new Set(keys));
    const legacyDistinct = distinctKeys.map((k) => hash(k).slice(0, 4));
    const base62Distinct = distinctKeys.map((k) => hashBase62(k, 6));

    const legacyUnique = new Set(legacyDistinct).size;
    const base62Unique = new Set(base62Distinct).size;

    const legacyCollisions = distinctKeys.length - legacyUnique;
    const base62Collisions = distinctKeys.length - base62Unique;

    // The legacy 4-char base-36 hash collides heavily on this corpus...
    expect(legacyCollisions).toBeGreaterThan(0);
    // ...while the base-62 6-char hash has zero (or near-zero) collisions.
    expect(base62Collisions).toBeLessThan(legacyCollisions);
    expect(base62Collisions).toBe(0);

    // Reference the raw arrays to keep them meaningful for future debugging.
    expect(legacyGroups).toHaveLength(keys.length);
    expect(base62Groups).toHaveLength(keys.length);
    expect(countCollisions).toBeInstanceOf(Function);
  });
});
