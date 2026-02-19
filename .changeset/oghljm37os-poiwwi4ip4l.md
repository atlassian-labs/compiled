---
"@compiled/babel-plugin": minor
"@compiled/react": minor
"@compiled/jest": minor
---

Bump csstype from 3.1.3 to 3.2.3

Updates csstype to the latest version which reflects the evolution of CSS standards:

**Removed at-rules:**
- `@scroll-timeline` - Abandoned CSS proposal; Scroll-driven Animations now use `animation-timeline` property
- `@viewport` - Obsolete at-rule with no modern browser support; viewport configuration now handled via meta tags and media queries

**Added at-rules:**
- `@container` - CSS Container Queries (modern, growing browser support)
- `@position-try` - CSS Anchor Positioning (newer standard)
- `@view-transition` - View Transitions API (newer standard)

Updated the AtRules type mapping in babel-plugin to match the new csstype definitions. No breaking changes for Compiled users as the removed at-rules are not used in the codebase.
