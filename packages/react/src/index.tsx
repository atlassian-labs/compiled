import { createElement } from 'react';

import type { CompiledJSX } from './jsx/jsx-local-namespace';
import type { CssFunction, CSSProps } from './types';

// --------------------------------------------------------------------
// TODO: Delete global types in the next major version
// Instead of being global they will be sourced via a local jsx namespace
declare module 'react' {
  // We must match the same type signature so the generic needs to stay.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface DOMAttributes<T> {
    css?: CssFunction | CssFunction[];
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      /**
       * Tie styles to an element.
       *
       * ```
       * css={{ fontSize: 12 }} // Object CSS
       * css={`font-size: 12px;`} // Template literal CSS
       * css={[{ fontSize: 12 }, `font-size: 12px;`]} // Array CSS
       * ```
       *
       * For more help, read the docs:
       * https://compiledcssinjs.com/docs/api-css-prop
       */
      css?: CssFunction | CssFunction[];
    }
  }
}
// END TODO
// --------------------------------------------------------------------

export { keyframes } from './keyframes';
export { styled } from './styled';
export { ClassNames } from './class-names';
export { default as css } from './css';

// Pass through the (classic) jsx runtime.
// Compiled currently doesn't define its own and uses this purely to enable a local jsx namespace.
// This is deliberate unfortunately import/export doesn't acknowledge namespace exports.
// eslint-disable-next-line import/export
export const jsx = createElement;

export type { CssFunction, CSSProps };
export type { CssObject } from './styled';

// This is deliberate unfortunately import/export doesn't acknowledge namespace exports.
// eslint-disable-next-line import/export
export namespace jsx {
  export namespace JSX {
    export type Element = CompiledJSX.Element;
    export type ElementClass = CompiledJSX.ElementClass;
    export type ElementAttributesProperty = CompiledJSX.ElementAttributesProperty;
    export type ElementChildrenAttribute = CompiledJSX.ElementChildrenAttribute;
    export type LibraryManagedAttributes<C, P> = CompiledJSX.LibraryManagedAttributes<C, P>;
    export type IntrinsicAttributes = CompiledJSX.IntrinsicAttributes;
    export type IntrinsicClassAttributes<T> = CompiledJSX.IntrinsicClassAttributes<T>;
    export type IntrinsicElements = CompiledJSX.IntrinsicElements;
  }
}
