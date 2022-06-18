export type { CompiledJSX as JSX } from './jsx-local-namespace';

// Pass through the (automatic) jsx dev runtime.
// Compiled currently doesn't define its own and uses this purely to enable a local jsx namespace.
// https://github.com/facebook/react/blob/main/packages/react/jsx-dev-runtime.js#L10
// @ts-expect-error these don't appear to be typed
export { Fragment, jsxDEV } from 'react/jsx-dev-runtime';
