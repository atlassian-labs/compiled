---
'@compiled/react': minor
---

Types for `createStrictAPI` have been refactored to improve type inference and expectations.

Previously defining the schema came with a lot of redundant work. For every pseudo that you wanted to type you would have to define it, and then all of the base types again, like so:

```ts
interface Schema {
  background: 'var(--bg)';
  color: 'var(--color)';
  '&:hover': {
    background: 'var(--bg)';
    color: 'var(--color-hovered)';
  };
}

createStrictAPI<Schema>();
```

If you missed a value / didn't type every possible pseudo it would fallback to the CSSProperties value from csstype. This was mostly unexpected. So for example right now `&:hover` has been typed, but no other pseudo. So it nothing else would benefit from the schema types.

With this refactor it now always falls back to the top level types if not defined, meaning you only need to type the values you want to explicitly support. In the previous example we're now able to remove the `background` property as it's the same as the top one. All pseudos are now typed as well.

```diff
interface Schema {
  background: 'var(--bg)';
  color: 'var(--color)';
  '&:hover': {
-    background: 'var(--bg)';
    color: 'var(--color-hovered)';
  };
}

createStrictAPI<Schema>();
```
