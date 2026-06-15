# @compiled/vanilla

A framework-agnostic compile-time CSS-in-JS API for [Compiled](https://compiledcssinjs.com).

`@compiled/vanilla` is intended for codebases (or parts of codebases) that need
to generate class-name strings at build time **without taking a React
dependency**. Common consumers are ProseMirror `toDOM` helpers, plain DOM
utilities, and other framework-agnostic style sites in apps that already use
`@compiled/react` elsewhere.

## Quick start

```ts
import { cssMap, ax } from '@compiled/vanilla';

const styles = cssMap({
  base: { color: 'red', fontWeight: 'bold' },
  hover: { '&:hover': { color: 'darkred' } },
});

// Use the className strings directly on a DOM element.
element.className = ax([styles.base, styles.hover]);
```

At build time the Compiled Babel plugin sees the import from
`@compiled/vanilla`, transforms the `cssMap` call into atomic class names, and
emits an `insertSheets(...)` call that inserts the generated rules into the
document head when the module is loaded.

## Differences from `@compiled/react`

| Concern          | `@compiled/react`                                                 | `@compiled/vanilla`                                             |
| ---------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- |
| React dependency | Required                                                          | None                                                            |
| Style injection  | Via `<CC><CS>` JSX components rendered by React                   | Via runtime `insertSheets` call inserted automatically by Babel |
| Surface area     | `styled`, `css`, `cssMap`, `keyframes`, `ClassNames`, `xcss`, ... | `cssMap` + `ax`                                                 |
| Use case         | React components                                                  | Non-React code (ProseMirror, plain DOM, etc.)                   |

If you are writing a React component, prefer `@compiled/react`.
