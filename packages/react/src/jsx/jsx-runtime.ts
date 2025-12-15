export type { CompiledJSX as JSX } from './jsx-local-namespace';

import * as ReactJSXRuntime from 'react/jsx-runtime';
export const Fragment = ReactJSXRuntime.Fragment;
export const jsx: typeof ReactJSXRuntime.jsx = ReactJSXRuntime.jsx;
export const jsxs: typeof ReactJSXRuntime.jsxs = ReactJSXRuntime.jsxs;
