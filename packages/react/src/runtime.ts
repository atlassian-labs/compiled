export { CC, CS, ax, ac, clearAcCache, ix } from './runtime/index.js';
// `insertRule` is exposed so framework-agnostic packages (currently only
// `@compiled/vanilla`) can reuse the bucket-ordered insertion logic without
// reaching into private `@compiled/react/runtime/sheet` paths. Sharing the
// helper means vanilla- and React-emitted rules cohabit the same `<style>`
// buckets in `document.head`, preserving the cascade ordering Compiled
// guarantees across both modes.
export { default as insertRule } from './runtime/sheet.js';
