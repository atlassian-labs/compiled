---
'@compiled/babel-plugin': minor
'@compiled/css': minor
'@compiled/webpack-loader': minor
'@compiled/parcel-config': minor
---

[BREAKING] Add a deterministic sorting to media queries and other at-rules in Compiled. We use a simplified version of what the [`sort-css-media-queries`](https://github.com/OlehDutchenko/sort-css-media-queries?tab=readme-ov-file#mobile-first) package does - sorting `min-width` and `min-height` from smallest to largest, then `max-width` and `max-height` from largest to smallest. If ranges or features involving `height` and `width` are not present in the at-rule, the at-rule will be sorted lexicographically / alphabetically.

Situations you may need to be careful of:

- In situations where two at-rules with the same property apply at the same time, this may break your styles, as the order in which the styles are applied will change. (For example, overlapping `@media` queries)
- Because all at-rules will now be sorted lexicographically / alphabetically, `@layer` blocks you pass to Compiled APIs may not be outputted in the same order, causing different CSS than expected.

This is turned on by default. If you do not want your at-rules to be sorted, set `sortAtRules` to `false` in your configuration:

- Webpack users: the `@compiled/webpack-loader` options in your Webpack configuration
- Parcel users: your Compiled configuration, e.g. `.compiledcssrc` or similar
- Babel users: the `@compiled/babel-plugin-strip-runtime` options in your `.babelrc.json` or similar, if you have the `@compiled/babel-plugin-strip-runtime` plugin enabled.
