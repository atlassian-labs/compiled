---
'@compiled/css': minor
---

Throw a build error when a selector ends with a dangling combinator, for example `css({ '>': { marginLeft: 10 } })` or `css({ '& +': { ... } })`. Compiled used to emit `.hash > {}`, which browsers reject, so the declarations silently never applied.

This can fail builds that previously compiled. A rule is now rejected as a whole, so `css({ '.a, .b >': { color: 'red' } })` no longer emits its working `.a` half, and `css({ '& >': { color: 'blue', '.child': { color: 'red' } } })` no longer emits its working `& > .child` half. Add the missing selector to fix them: `'& > *'`, or move the declarations under the nested child. Selectors whose only content is nested rules, such as `css({ '& >': { '.child': { color: 'red' } } })`, are unaffected.
