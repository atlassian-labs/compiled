# @compiled/core/babel-plugin

This folder and `package.json` exists to add another entry point to `@compiled/core`.
When the `exports` property is more widely used we can remove this (we've currently defined it in `package.json`,
but it won't do much on node versions that don't support it).
