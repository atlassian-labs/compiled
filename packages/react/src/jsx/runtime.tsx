/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export type { CompiledJSX as JSX } from './jsx-namespace';

import * as runtime from 'react/jsx-runtime';

// @ts-expect-error
export const Fragment = runtime.Fragment;

export function jsx(type: any, props: any, key: any): any {
  // @ts-expect-error
  return runtime.jsx(type, props, key);
}

export function jsxs(type: any, props: any, key: any) {
  // @ts-expect-error
  return runtime.jsxs(type, props, key);
}
