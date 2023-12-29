---
'@compiled/babel-plugin-strip-runtime': minor
'@compiled/babel-plugin': minor
---

\[BREAKING\] Fix @compiled/babel-plugin handling of classic JSX pragma. Involves several breaking changes.

- Move the below @compiled/babel-plugin-strip-runtime behaviour to @compiled/babel-plugin
  - Classic JSX pragma will no longer affect the Babel output: instead of seeing `jsx` function calls in the output, you will see `React.createElement` calls again. (Added to @compiled/babel-plugin-strip-runtime in v0.27.0)
- @compiled/babel-plugin: Due to the above behaviour change, a classic JSX pragma (`/** @jsx jsx */`) is used, React will always be imported regardless of the value of `importReact`.
- @compiled/babel-plugin: We don't support specifying the `pragma` option through `@babel/preset-react` or `@babel/plugin-transform-react-jsx` - we will now throw an error if this happens.
