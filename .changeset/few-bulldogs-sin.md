---
'@compiled/babel-plugin': patch
---

- Normalize prop usage in styled API to make it easier to avoid name clashing
- Fix bug in styled API where destructuring can remove values out of props
- Ensure props are not displayed as HTML attributes, unless they are valid attributes
