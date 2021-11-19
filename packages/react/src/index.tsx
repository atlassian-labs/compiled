import { createElement } from 'react';

import type { CompiledJSX } from './jsx/jsx-local-namespace';
import type { CssFunction, CSSProps } from './types';

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
