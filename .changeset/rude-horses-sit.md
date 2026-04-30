---
'@compiled/react': patch
---

Fix JSX namespace types compatibility with React 19. `CompiledJSX.LibraryManagedAttributes` no longer delegates to `ReactJSXLibraryManagedAttributes`, which caused a circular reference when used with React 19's `@types/react`. The type now directly intersects component props with `{ key?: React.Key }`, which works correctly for both React 18 and React 19.
