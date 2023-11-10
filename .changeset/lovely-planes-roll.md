---
'@compiled/babel-plugin-strip-runtime': minor
'@compiled/eslint-plugin': minor
'@compiled/utils': minor
---

- `@compiled/babel-plugin-strip-runtime`: Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
- `@compiled/eslint-plugin`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx
- `@compiled/utils`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx
