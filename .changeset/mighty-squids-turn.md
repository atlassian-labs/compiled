---
'@compiled/webpack-loader': patch
---

When parsing the Webpack config `rules` option, also handle the situation where a rule might be falsy (null, undefined, 0, "")
