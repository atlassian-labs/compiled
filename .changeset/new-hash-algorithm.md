---
'@compiled/babel-plugin': minor
'@compiled/css': minor
'@compiled/react': minor
'@compiled/utils': minor
---

Add an opt-in `collisionResistantHash` option that generates atomic class names using a base-62,
full-width hash to eliminate hash collisions. **Default behaviour is unchanged** — you must opt in.

Atomic class names use a base-36 encoding truncated to 4 characters per hash segment
(`_<group><value>`). This truncation has a severely constrained effective hash space due to leading-digit bias, and has a
strong leading-character bias, causing class name collisions in large applications that can result
in `ax()` silently dropping styles.

Setting `collisionResistantHash: true` (a babel plugin / transform option) switches to a base-62
encoding of the full 32-bit MurmurHash2 value:

- **Group hash**: 6 characters (base-62 covers the full 32-bit space with no truncation)
- **Value hash**: 4 characters (fixed width)
- Atomic class names change from 9 characters (`_1e0c1ule`) to 11 characters (`_3iDTPbvLZJ`)

The option is a **migration flag**. It defaults to `false`, so this release is additive and
non-breaking — existing output is byte-for-byte identical. Products can enable it incrementally
(for example via an environment variable or feature gate in their build config), roll back instantly
by turning it off and rebuilding, and a future major release will flip the default to `true` and
remove the legacy branch.

`ax()` extracts the group key using `className.slice(0, className.length - 4)` — a fast,
fixed-offset slice that handles both the legacy 9-character and new 11-character class names. Because
the two formats produce different-length group keys, they are structurally disjoint and never
falsely deduplicate each other, so mixing old and new class names on a page (during the migration
window, or between pre-built dependency CSS and freshly compiled app CSS) is safe.

The new `hashBase62` encoding is byte-for-byte compatible with the atlaspack SWC transformer's
`to_base62`, ensuring class names are identical across the babel plugin and SWC toolchains.
