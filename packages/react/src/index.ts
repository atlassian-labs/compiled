import { createElement } from 'react';

import type { CompiledJSX } from './jsx/jsx-local-namespace';

export { ClassNames } from './class-names';
export { createStrictAPI } from './create-strict-api';
export { default as css } from './css';
export { default as cssMap } from './css-map';
export { keyframes } from './keyframes';
export { styled } from './styled';
export type {
  CSSProperties,
  CSSProps,
  CSSPseudos,
  CssFunction,
  CssType,
  StrictCSSProperties,
} from './types';
export { type XCSSAllProperties, type XCSSAllPseudos, type XCSSProp, cx } from './xcss-prop';

// Pass through the (classic) jsx runtime.
// Compiled currently doesn't define its own and uses this purely to enable a local jsx namespace.
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
