---
'@compiled/babel-plugin-strip-runtime': minor
'@compiled/eslint-plugin': patch
'@compiled/utils': patch
---

* @compiled/babel-plugin-strip-runtime:
  * Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
  * The previous version of this PR caused a regression where using the classic JSX pragma `/** @jsx jsx */` with Emotion no longer worked; this is now fixed.
* @compiled/utils: Add JSX pragma regex (as used by `babel-plugin-transform-react-jsx`) directly to @compiled/utils
* @compiled/eslint-plugin: Use the official JSX pragma regex `/^\s*\*?\s*@jsx\s+([^\s]+)\s*$/m` instead of `/@jsx (\w+)/`; the former is used in `babel-plugin-transform-react-jsx`
