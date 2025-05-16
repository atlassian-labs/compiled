---
'@compiled/parcel-transformer-external': none
'@compiled/babel-component-extracted-fixture': none
'@compiled/parcel-transformer': none
'@compiled/babel-component-fixture': none
'@compiled/css': patch
---

Flatten multiple selectors into separate rules to better deduplicate and sort styles, eg.:

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

This will be enabled by default in a future minor release once impact is validated.

Without this, pseudo-selectors aren't sorted properly in some scenarios.
