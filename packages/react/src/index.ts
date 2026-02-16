import { createElement } from 'react';

import type { CompiledJSX } from './jsx/jsx-local-namespace.js';

export { ClassNames } from './class-names/index.js';
export { createStrictAPI } from './create-strict-api/index.js';
export type {
  PseudosDeclarations,
  MediaQueries,
  AllowedStyles,
  ApplySchema,
  ApplySchemaMap,
} from './create-strict-api/types.js';
export { default as css } from './css/index.js';
export { default as cssMap } from './css-map/index.js';
export { keyframes } from './keyframes/index.js';
export { styled, StyledProps } from './styled/index.js';
export type {
  CSSProperties,
  CSSProps,
  CSSPseudos,
  CssFunction,
  CssType,
  StrictCSSProperties,
} from './types.js';
export {
  type XCSSAllProperties,
  type XCSSAllPseudos,
  type XCSSProp,
  type CompiledStyles,
  type Internal$XCSSProp,
  cx,
} from './xcss-prop/index.js';

// Pass through the (classic) jsx runtime.
// Compiled currently doesn't define its own and uses this purely to enable a local jsx namespace.
export const jsx = createElement;

export namespace jsx {
  export namespace JSX {
    export type Element = CompiledJSX.Element;
    export type ElementType = CompiledJSX.ElementType;
    export type ElementClass = CompiledJSX.ElementClass;
    export type ElementAttributesProperty = CompiledJSX.ElementAttributesProperty;
    export type ElementChildrenAttribute = CompiledJSX.ElementChildrenAttribute;
    export type LibraryManagedAttributes<C, P> = CompiledJSX.LibraryManagedAttributes<C, P>;
    export type IntrinsicAttributes = CompiledJSX.IntrinsicAttributes;
    export type IntrinsicClassAttributes<T> = CompiledJSX.IntrinsicClassAttributes<T>;
    export type IntrinsicElements = CompiledJSX.IntrinsicElements;
  }
}
