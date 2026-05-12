---
'@compiled/react': patch
---

Fix class component prop types under TypeScript 6. `ElementAttributesProperty` and `ElementChildrenAttribute` are now declared as inline interfaces in the `CompiledJSX` namespace rather than type aliases to `JSX.ElementAttributesProperty` / `JSX.ElementChildrenAttribute`. The aliases caused a circular reference when `@compiled/react` is used as `jsxImportSource` (since `JSX` re-exports `CompiledJSX`), which TypeScript 6 resolves differently — passing the class instance type to `LibraryManagedAttributes` instead of the extracted props, making all class component props inaccessible in JSX.
