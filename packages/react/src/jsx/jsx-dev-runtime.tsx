export type { CompiledJSX as JSX } from './jsx-local-namespace';

// Pass through the (automatic) jsx dev runtime.
// Compiled currently doesn't define its own and uses this purely to enable a local jsx namespace.
export * from 'react/jsx-dev-runtime';
