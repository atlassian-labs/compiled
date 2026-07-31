---
'@compiled/webpack-loader': minor
'@compiled/vite-plugin': patch
---

Forward the `collisionResistantHash` option through to `@compiled/babel-plugin`.

This is a follow-up to [#1920](https://github.com/atlassian-labs/compiled/pull/1920), which introduced the `collisionResistantHash` option in `@compiled/babel-plugin` and `@compiled/css` but did not expose it on the `@compiled/webpack-loader` option surface — so the webpack/rspack build path could not enable it. The option is now part of `CompiledLoaderOptions`, the loader schema, and the options passed to the babel plugin.

`@compiled/vite-plugin` already forwarded user-supplied options to the babel plugin (its options type extends the babel-plugin options), so this was already functional; `collisionResistantHash` is now added to its explicit defaults list and package docs for consistency and discoverability.
