---
'@compiled/parcel-transformer-external': none
'@compiled/babel-component-extracted-fixture': none
'@compiled/parcel-transformer': none
'@compiled/babel-component-fixture': none
'@compiled/css': minor
---

Adds a possibly breaking change to flatten multiple selectors into separate rules to better deduplicate and sort styles.

You can disable this by setting `flattenMultipleSelectors: false` in Babel and other config.

For example:

```tsx
css({
  '&:hover, &:focus': {
    color: 'red',
  },
});
```

Is transformed into the same code as this would be:

```tsx
css({
  '&:hover': { color: 'red' },
  '&:focus': { color: 'red' },
});
```

Without this, pseudo-selectors aren't sorted properly in some scenarios.
