---
'@compiled/babel-plugin': patch
'@compiled/css': patch
---

Add support for @position-try global at-rule

Added support for CSS `@position-try` at-rule (CSS Anchor Positioning Level 1) in Compiled's cssMap API. The `@position-try` at-rule defines named fallback positions for CSS Anchor Positioning and is now correctly handled as a global at-rule, similar to `@keyframes`.

**What changed:**

- Added `'position-try'` to the ignored at-rules list in `packages/css/src/plugins/atomicify-rules.ts`
- This ensures `@position-try` rules are emitted globally without atomification or component scoping
- Both nested and flat syntax styles are supported:
  - Nested: `'@position-try': { '--name': { ... } }`
  - Flat: `'@position-try --name': { ... }`

**Browser support:**

- Chrome 125+ (May 2024)
- Firefox 131+ (Oct 2024)
- Safari 18.2+ (Dec 2024)

**Example usage:**

```typescript
const styles = cssMap({
  arrowBlockStart: {
    '@position-try --ds-arrow-block-start': {
      positionArea: 'block-start',
      margin: 0,
      marginBlockEnd: 'var(--ds-arrow-size, 8px)',
    },
  },
});
```

**Note:** Type support for `@position-try` was already present via csstype 3.2.3 (added in #1867). This change completes the implementation by ensuring the CSS transformation correctly handles it as a global at-rule.
