---
'@compiled/vite-plugin': minor
---

Add a `sortOnlyCompiledCss` option. When enabled, all imported `.compiled.css` files are grouped into a single `compiled-css` chunk and only the CSS emitted for that chunk is sorted, leaving other CSS in the bundle, such as CSS modules and global styles, in its original order. It defaults to `false`, so existing builds are unchanged.
