# @compiled/react/runtime

This folder and `package.json` exists to add another entry point to `@compiled/react`.
When the `exports` property is more widely used we can remove this (we've currently defined it in `package.json`,
but it won't do much on node versions that don't support it).
