/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export type { CompiledJSX as JSX } from './jsx-namespace';

import * as runtime from 'react/jsx-dev-runtime';

// @ts-expect-error
export const Fragment = runtime.Fragment;

export function jsxDEV(
  type: any,
  props: any,
  key: any,
  isStaticChildren: any,
  source: any,
  self: any
): any {
  // @ts-expect-error
  return runtime.jsxDEV(type, props, key, isStaticChildren, source, self);
}
