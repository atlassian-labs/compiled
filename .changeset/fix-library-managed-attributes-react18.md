---
'@compiled/react': patch
---

Fix `LibraryManagedAttributes` to restore React 18 compatibility and `defaultProps` stripping.

1. `key` no longer accepted `null`, contradicting `React.Attributes` which defines `key?: Key | null | undefined`. This caused `TS2322` errors in React 18 codebases when passing a nullable key (e.g. `key={item?.id ?? null}`).

2. Using `P` directly instead of `React.JSX.LibraryManagedAttributes<C, P>` broke `defaultProps` stripping for class components — props covered by `defaultProps` were no longer treated as optional at the call site (`TS2740`).

The fix delegates to `React.JSX.LibraryManagedAttributes<C, P>` (which correctly strips `defaultProps`) and explicitly restores `key?: React.Key | null` to align with `React.Attributes`. This avoids the circular reference issue since `React.JSX.LibraryManagedAttributes` does not route through the global `JSX` namespace.

Also fixes the `typecheck:react18` test which used `toMatchTypeOf` (which does not catch type narrowing regressions) — replaced with `toEqualTypeOf` on `Managed['key']`.
