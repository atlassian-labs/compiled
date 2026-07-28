---
'@compiled/babel-plugin': major
'@compiled/css': major
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

The option is a **migration flag**. It defaults to `false`, so the generated CSS is unchanged by
default — existing output is byte-for-byte identical. Products can enable it incrementally (for
example via an environment variable or feature gate in their build config), roll back instantly by
turning it off and rebuilding, and a future major release will flip the default to `true` and remove
the legacy branch.

**Breaking:** `@compiled/babel-plugin` and `@compiled/css` now declare `@compiled/react` `>=1.0.0`
as a peer dependency. Because these packages can emit the new 11-character atomic class names, the
consuming app must run a runtime whose `ax()` can parse them (older runtimes use a fixed slice
offset and corrupt deduplication of 11-character classes). Declaring the floor makes this
install-time enforced: adopting a plugin version capable of the new hash forces the consumer onto
`@compiled/react@>=1.0.0`, preventing a new-hash-output / old-runtime mismatch. This is the primary
guardrail for consumers outside AFM (inside AFM the floor is additionally guaranteed by the root
`resolutions` + `alignedDependencies` pin).

Mixing legacy 9-character and new 11-character class names on a page is safe: the `>=1.0.0`
runtime's `ax()` extracts the group key with `className.slice(0, className.length - 4)`, so the two
formats produce different-length group keys, are structurally disjoint, and never falsely
deduplicate each other (whether during the migration window or between pre-built dependency CSS and
freshly compiled app CSS). This forward-compatible `ax()` behaviour already shipped in
`@compiled/react@1.0.0` — which is exactly why it is the peer-dependency floor.

The new `hashBase62` encoding is byte-for-byte compatible with the atlaspack SWC transformer's
`to_base62`, ensuring class names are identical across the babel plugin and SWC toolchains.
