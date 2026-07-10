---
'@compiled/css': major
'@compiled/react': major
'@compiled/utils': major
---

Use a base-62, full-width hash for atomic class name generation to eliminate hash collisions.

Atomic class names previously used a base-36 encoding truncated to 4 characters per hash segment
(`_<group><value>`). This truncation collapsed the effective hash space to ~93K values and had a
strong leading-character bias, causing class name collisions in large applications that could
result in `ax()` silently dropping styles.

Class names now use a base-62 encoding of the full 32-bit MurmurHash2 value:

- **Group hash**: 6 characters (base-62 covers the full 32-bit space with no truncation)
- **Value hash**: 4 characters (fixed width)
- Atomic class names change from 9 characters (`_1e0c1ule`) to 11 characters (`_3iDTPbvLZJ`)

`ax()` now extracts the group key using `className.slice(0, className.length - 4)` — a fast,
fixed-offset slice — instead of a hardcoded 5-character prefix. Because old (9-char) and new
(11-char) class names produce different-length group keys, they are structurally disjoint and
never falsely deduplicate each other during the migration window.

The new `hashBase62` encoding is byte-for-byte compatible with the atlaspack SWC transformer's
`to_base62`, ensuring class names are identical across the babel plugin and SWC toolchains.
