---
'@compiled/babel-plugin': major
'@compiled/css': minor
'@compiled/react': minor
---

Add an opt-in `group` option to `cssMap` that emits one shared atomic class per nested selector group within a variant, instead of one atomic class per CSS property. This reduces the number of atomic classes generated for variants with many nested rules under the same selector, which in turn lowers hash-collision pressure and reduces CSS bundle size for style-heavy components.

```ts
const styles = cssMap(
  {
    one: { '> span': { paddingBottom: '2px' } },
    two: { outlineWidth: '2px' },
  },
  { group: true }
);
```

The option is opt-in and backward-compatible: when omitted (or set to `false`), `cssMap` emits atomic classes exactly as before.
