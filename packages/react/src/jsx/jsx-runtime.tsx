/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// Pass through the (automatic) jsx runtime.
// Compiled currently doesn't define its own and uses this purely to enable a local jsx namespace.
import * as runtime from 'react/jsx-runtime';

import CompiledComponent from './compiled-component';

export type { CompiledJSX as JSX } from './jsx-local-namespace';

export function jsx(type: any, props: any, key: any): any {
  if (!Object.hasOwnProperty.call(props, 'css')) {
    // @ts-expect-error
    return runtime.jsx(type, props, key);
  }

  // @ts-expect-error
  return runtime.jsx(CompiledComponent, Object.assign(props, { type }), key);
}

export function jsxs(type: any, props: any, key: any): any {
  if (!Object.hasOwnProperty.call(props, 'css')) {
    // @ts-expect-error
    return runtime.jsx(type, props, key);
  }

  // @ts-expect-error
  return runtime.jsx(CompiledComponent, Object.assign(props, { type }), key);
}

// @ts-expect-error
export const Fragment = runtime.Fragment;
