---
'@compiled/webpack-loader': minor
'@compiled/vite-plugin': patch
'@compiled/parcel-transformer': patch
'@compiled/parcel-optimizer': patch
---

Forward the `collisionResistantHash` option through bundler integrations to `@compiled/babel-plugin`.

This is a follow-up to [#1920](https://github.com/atlassian-labs/compiled/pull/1920), which introduced the option in `@compiled/babel-plugin` and `@compiled/css` but did not expose it on `@compiled/webpack-loader`'s options schema (so webpack/rspack builds could not enable it). `@compiled/vite-plugin` already forwarded the option via its babel-plugin options type; this release documents it in the defaults list and package docs for consistency.

Also fix `@compiled/parcel-transformer` and `@compiled/parcel-optimizer` config loading to search upward from the Parcel entry (`config.searchPath`) instead of `options.projectRoot`. In yarn/npm workspaces `projectRoot` is the monorepo root, so per-package `.compiledcssrc` files (including `collisionResistantHash`) were previously ignored.
