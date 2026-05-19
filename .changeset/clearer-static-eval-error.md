---
'@compiled/babel-plugin': patch
---

Improve the error message thrown when Compiled cannot statically evaluate an object property key.

When an object property key references a value Compiled cannot resolve at build time (for example, a constant re-exported through a barrel file), the babel plugin now:

- Prints the full source-level name of the expression (e.g. `theme.color.primary` or `theme["breakpoint-sm"]`) instead of the AST node type (`MemberExpression`).
- Lists the most common causes (barrel files, `let`/`var` bindings, runtime values, unresolved module imports, TypeScript-only constructs) so the developer can self-diagnose without digging into Compiled internals.

Also fixes a small bug where the previous message dropped the closing quote (`"...UNSAFE_container` instead of `"...UNSAFE_container"`).

**Before**

```
Cannot statically evaluate the value of "MemberExpression
```

**After**

```
Cannot statically evaluate the value of "UNSAFE_container.below.xs" at build time.
Compiled needs to know the value of object property keys at build time, but could not resolve "UNSAFE_container.below.xs". This commonly happens when:
  - The value is re-exported through a barrel file (e.g. `export * from './foo'`). Try importing directly from the source module.
  - The binding is declared with `let` or `var`, or is reassigned. Use `const` and avoid mutation.
  - The value is produced at runtime (e.g. function calls, dynamic imports, values from `process.env`). Use a literal expression Compiled can read at build time.
  - The value comes from a module Compiled cannot statically resolve. Check the import path and any custom resolver configuration.
  - The expression relies on TypeScript-only constructs (e.g. `as const` widening) that Compiled does not yet evaluate.
```

Closes #1606.
