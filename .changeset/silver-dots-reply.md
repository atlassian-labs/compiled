---
'@compiled/react': minor
---

**Breaking change:** When using the `css` prop with [TypeScript](https://www.typescriptlang.org) you now need to declare a JSX pragma enabling types for that module. Previously when importing the `@compiled/react` package the global JSX namespace would be polluted as a side effect potentially causing collisions with other CSS-in-JS libraries. Now thanks to the use of [locally scoped JSX namespaces](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#locally-scoped-jsx-namespaces) the global JSX namespace will no longer be polluted.

As an added bonus the `css` prop will only be available on JSX elements that have also defined a `className` prop with the potential for more type safe features later on.

Make sure to update all Compiled dependencies to latest when adopting this change.

**Automatic runtime**

```diff
-import '@compiled/react';
+/** @jsxImportSource @compiled/react */

<div css={{ display: 'block' }} />;
```

**Classic runtime**

```diff
-import '@compiled/react';
+/** @jsx jsx */
+import { jsx } from '@compiled/react';

<div css={{ display: 'block' }} />;
```

To aid consumers adopt this change easily a new ESLint rule `jsx-pragma` has been created which will automatically migrate you to use a JSX pragma if missing when running with `--fix`. The rule takes an option to configure the runtime (either classic or automatic) and defaults to automatic.

```sh
npm i @compiled/eslint-plugin
```

```json
{
  "rules": {
    "@compiled/jsx-pragma": ["error", { "runtime": "classic" }]
  }
}
```
