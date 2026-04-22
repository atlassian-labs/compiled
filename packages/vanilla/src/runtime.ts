/**
 * Runtime entry for `@compiled/vanilla`.
 *
 * - `ax` is re-exported from `@compiled/react/runtime` so vanilla and React
 *   consumers share a single, deduplicated implementation.
 * - `insertSheets` is the helper emitted by the Babel plugin after a vanilla
 *   `cssMap` call: it inserts the generated atomic CSS rules into the
 *   document head exactly once per rule, regardless of how many times the
 *   module is evaluated. The name avoids `injectGlobal`, which has an
 *   established "unscoped global CSS" meaning elsewhere in the ecosystem.
 */
export { ax } from '@compiled/react/runtime';
export { default as insertSheets } from './runtime/insert-sheets';
