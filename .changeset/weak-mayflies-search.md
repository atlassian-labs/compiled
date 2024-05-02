---
'@compiled/parcel-transformer': patch
'@compiled/webpack-loader': patch
'@compiled/babel-plugin': patch
'@compiled/utils': patch
'@compiled/css': patch
---

Add the `enforcePseudoOrder` option. This ensures that the pseudo-selectors from Compiled are always applied in the order

- `:link`
- `:visited`
- `:focus-within`
- `:focus`
- `:focus-visible`
- `:hover`
- `:active`

even when components are imported from multiple packages. This is at the expense of lengthening those selectors considerably (by adding `:not(#\\##\\##\\##\\##\\#)` to the end of those selectors).

This is necessary if you use multiple pseudo-selectors on the same component (e.g. `:hover` and `:active`), and if you are creating Compiled components that are consumed in other packages or projects.
