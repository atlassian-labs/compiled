---
'@compiled/vite-plugin': minor
---

Add a `sortOnlyCompiledCss` option. When enabled, the plugin sorts only the rules that came from imported `.compiled.css` files and leaves all other CSS in the bundle, such as CSS modules and global styles, in its original order. It defaults to `false`, so existing builds are unchanged.
