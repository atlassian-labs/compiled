---
'@compiled/babel-plugin': minor
---

Fix xcss being incompatible with codebases that use Emotion and Compiled:

- Add `processXcss` option to `@compiled/babel-plugin`. If `processXcss` is set to false, `xcss` usages will be ignored, and will not be processed as Compiled. (Note that `xcss` is currently implemented in Atlassian Design System using Emotion.) Defaults to `true`.
- `css` usages in a file will no longer be processed as Compiled if `xcss` is used in the same file, so long as there is not a `@compiled/react` import specified in that file.
