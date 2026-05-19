---
'@compiled/react': patch
---

`ax()` now emits a development-only warning when it receives a non-string value (typically an object) instead of a precompiled className.

The previous failure mode was a cryptic runtime crash — `classNames[0].includes is not a function` — that gave the developer no hint about where in their JSX the bad value was coming from. The most common cause is passing a raw style object to a `css` prop or a styled component without wrapping it with `css({...})` first, for example:

```jsx
// This makes a raw object flow into ax() at runtime.
<MyComponent css={someCondition && { color: 'red' }} />
```

The warning now points at the actual problem and the fix:

```
@compiled/react/runtime - DEV WARNING

ax() received an object (`{"color":"red"}`) at index 0.
  Compiled expects precompiled className strings here. If you passed a raw style object to a `css` prop or styled component — for example `<MyComponent css={{ color: 'red' }} />` — wrap it with `css({...})` so Compiled can transform it at build time:
      <MyComponent css={css({ color: 'red' })} />
```

The warning is dev-only and deduped per type, so production bundles pay no cost (the `process.env.NODE_ENV === 'development'` guard is tree-shaken) and development consoles aren't spammed on every render.

Closes #1495.
