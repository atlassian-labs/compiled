import { createElement } from 'react';

import type { CompiledJSX } from './jsx/jsx-namespace';
import type { CssFunction, CSSProps } from './types';
export { keyframes } from './keyframes';

export { styled } from './styled';
export { ClassNames } from './class-names';
export { default as css } from './css';
export type { CssFunction, CSSProps };
export type { CssObject } from './styled';

// --------------------------------------------------------------------
// TODO: Delete global types in the next major version
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

export const jsx = createElement;

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
