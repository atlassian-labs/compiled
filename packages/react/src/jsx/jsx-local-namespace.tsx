import type { CssFunction } from '../types';

type WithConditionalCSSProp<TProps> = 'className' extends keyof TProps
  ? string extends TProps['className' & keyof TProps]
    ? {
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
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {}
  : // eslint-disable-next-line @typescript-eslint/ban-types
    {};

// Unpack all here to avoid infinite self-referencing when defining our own JSX namespace
type ReactJSXElement = JSX.Element;
type ReactJSXElementClass = JSX.ElementClass;
type ReactJSXElementAttributesProperty = JSX.ElementAttributesProperty;
type ReactJSXElementChildrenAttribute = JSX.ElementChildrenAttribute;
type ReactJSXLibraryManagedAttributes<C, P> = JSX.LibraryManagedAttributes<C, P>;
type ReactJSXIntrinsicAttributes = JSX.IntrinsicAttributes;
type ReactJSXIntrinsicClassAttributes<T> = JSX.IntrinsicClassAttributes<T>;
type ReactJSXIntrinsicElements = JSX.IntrinsicElements;

export namespace CompiledJSX {
  export type Element = ReactJSXElement;
  export type ElementClass = ReactJSXElementClass;
  export type ElementAttributesProperty = ReactJSXElementAttributesProperty;
  export type ElementChildrenAttribute = ReactJSXElementChildrenAttribute;
  export type LibraryManagedAttributes<C, P> = WithConditionalCSSProp<P> &
    ReactJSXLibraryManagedAttributes<C, P>;
  export type IntrinsicAttributes = ReactJSXIntrinsicAttributes;
  export type IntrinsicClassAttributes<T> = ReactJSXIntrinsicClassAttributes<T>;
  export type IntrinsicElements = {
    [K in keyof ReactJSXIntrinsicElements]: ReactJSXIntrinsicElements[K] & {
      css?: CssFunction | CssFunction[];
    };
  };
}
