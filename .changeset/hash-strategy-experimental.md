---
'@compiled/babel-plugin': minor
'@compiled/eslint-plugin': minor
'@compiled/css': minor
'@compiled/react': minor
'@compiled/utils': patch
---

Add experimental `hashStrategy` option to `cssMap` for **internal use only**, use with **extreme caution**.

`hashStrategy` is **not officially supported** and is intentionally omitted from the public `cssMap` type signature. It is not discoverable by external consumers and may change or be removed without notice. Use with extreme caution.

### `@compiled/utils`

- Added `hashBase62` — a murmurhash2 variant that encodes the 32-bit hash in base-62 (digits + lower + uppercase letters), providing 8.8× more combinations per character than the existing base-36 `hash()`.

### `@compiled/css`

- Added `hashStrategy` option to `atomicify-rules` plugin and `transformCss`:
  - `'default'` — original base-36 behaviour, backward compatible.
  - `'enhanced'` — base-62 encoding, same 9-char class length, reduced collision risk.
  - `'max'` — full 32-bit base-62 group hash (11-char classes), structurally incompatible with legacy classes, eliminating cross-package collisions by construction.

### `@compiled/babel-plugin`

- `cssMap` now accepts an optional second argument `{ hashStrategy: 'default' | 'enhanced' | 'max' }`, validated at compile time.
- Unknown option names or invalid strategy values throw a build-time error.

### `@compiled/react`

- `ax` runtime updated to support variable-length atomic class names: the group key is now derived by stripping the last 4 characters (value hash) rather than using a fixed `ATOMIC_GROUP_LENGTH = 5`, correctly handling both 9-char (default/enhanced) and 11-char (max) class names.
- `ax` does not support multi-group classes with different length anymore, because the group hash is no longer same.

### `@compiled/eslint-plugin`

- Added `no-css-map-options` eslint rule to recommended eslint rules, to prevent accidental use of experimental cssMap options.
