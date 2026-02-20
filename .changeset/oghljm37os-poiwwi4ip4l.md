---
"@compiled/babel-plugin": minor
"@compiled/react": minor
"@compiled/jest": minor
---

Bump csstype from 3.1.3 to 3.2.3 and add missing `@container` support to cssMap validation

Updates csstype to the latest version which reflects the evolution of CSS standards. This change also fixes a bug where `@container` (CSS Container Queries) was partially supported in CSS processing but was missing from the cssMap type validation lookup table.

**Removed at-rules:**
- `@scroll-timeline` - Abandoned CSS proposal; Scroll-driven Animations now use `animation-timeline` property instead
- `@viewport` - Obsolete at-rule with no modern browser support; viewport configuration is now handled via meta tags and media queries

**Added at-rules (with full support):**
- `@container` - CSS Container Queries (now fully validated in cssMap)
- `@position-try` - CSS Anchor Positioning 
- `@view-transition` - View Transitions API

**What changed:**
- Updated csstype dependency to 3.2.3 across all packages
- Updated `AtRules` type mapping in `packages/babel-plugin/src/utils/css-map.ts` to include the new at-rules and remove deprecated ones
- Bumped to `minor` for `@compiled/babel-plugin` due to adding `@container` support to cssMap validation

**Note:** The `@scroll-timeline` and `@viewport` at-rules are not used anywhere in the Compiled codebase, so this is not a breaking change.
