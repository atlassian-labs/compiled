---
'@compiled/css': minor
---

[BREAKING] Add a deterministic sorting to media queries and other at-rules in Compiled. We use a simplified version of what the [`sort-css-media-queries`](https://github.com/OlehDutchenko/sort-css-media-queries?tab=readme-ov-file#mobile-first) package does - sorting `min-width` and `min-height` from smallest to largest, then `max-width` and `max-height` from largest to smallest.

In situations where two at-rules with the same property apply at the same time, this may break your styles, as the order in which the styles are applied will change.
