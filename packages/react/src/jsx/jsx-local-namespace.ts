import type { CssFunction } from '../types';

type WithConditionalCSSProp<TProps> = 'className' extends keyof TProps
  ? string extends TProps['className' & keyof TProps]
    ? {
        /**
         * ## CSS prop
         *
         * Style a JSX element.
         * For further details [read the API documentation](https://compiledcssinjs.com/docs/api-css-prop).
         *
         * ### Style with objects
         *
         * @example
         * ```
         * import { css } from '@compiled/react';
         *
         * <div css={css({ fontSize: 12 })} />
         * ```
         *
         * ### Style with template literals
         *
         * @example
         * ```
         * import { css } from '@compiled/react';
         *
         * <div css={css`color: red;`} />
         * ```
         *
         * ### Compose styles with arrays
         *
         * @example
         * ```
         * import { css } from '@compiled/react';
         *
         * <div
         *  css={[
         *    css({ fontSize: 12 }),
         *    css`color: red;`,
         *  ]}
         * />
         * ```
         */
        css?: CssFunction<void> | CssFunction<void>[];
      }
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {}
  : // eslint-disable-next-line @typescript-eslint/ban-types
    {};

// Unpack all here to avoid infinite self-referencing when defining our own JSX namespace
// Based on the code from @types/react@18.2.8 / @emotion-js
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/3197efc097d522c4bf02b94e1a0766d007d6cdeb/types/react/index.d.ts#LL3204C13-L3204C13
type ReactJSXElementType = string | React.JSXElementConstructor<any>;
type ReactJSXElement = JSX.Element;
type ReactJSXElementClass = JSX.ElementClass;
type ReactJSXIntrinsicAttributes = JSX.IntrinsicAttributes;
type ReactJSXIntrinsicClassAttributes<T> = JSX.IntrinsicClassAttributes<T>;
type ReactJSXIntrinsicElements = JSX.IntrinsicElements;

export namespace CompiledJSX {
  export type ElementType = ReactJSXElementType;
  export type Element = ReactJSXElement;
  export type ElementClass = ReactJSXElementClass;
  // Inline the interface shapes directly instead of aliasing JSX.ElementAttributesProperty
  // and JSX.ElementChildrenAttribute. Those are interfaces in the global JSX namespace, and
  // aliasing them makes the .d.ts depend on whatever JSX.ElementAttributesProperty resolves to
  // in the consumer's environment — which is not guaranteed when @compiled/react is used as
  // jsxImportSource (since it replaces the global JSX namespace). Inlining makes CompiledJSX
  // self-contained and correct regardless of the consumer's JSX namespace.
  // eslint-disable-next-line @typescript-eslint/ban-types
  export interface ElementAttributesProperty {
    // eslint-disable-next-line @typescript-eslint/ban-types
    props: {};
  }
  export interface ElementChildrenAttribute {
    // eslint-disable-next-line @typescript-eslint/ban-types
    children: {};
  }
  // React 18's @types/react delegated ReactManagedAttributes to GlobalJSXLibraryManagedAttributes,
  // which aliased back to JSX.LibraryManagedAttributes — creating a circular reference when
  // CompiledJSX is the JSX namespace. React 19 removed that indirection. We avoid it entirely by
  // intersecting P with { key?: React.Key } directly. With a correct ElementAttributesProperty,
  // TypeScript pre-extracts the props type from class instances before passing P here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type LibraryManagedAttributes<_C, P> = WithConditionalCSSProp<P> & P & { key?: React.Key };
  export type IntrinsicAttributes = ReactJSXIntrinsicAttributes;
  export type IntrinsicClassAttributes<T> = ReactJSXIntrinsicClassAttributes<T>;
  export type IntrinsicElements = {
    [K in keyof ReactJSXIntrinsicElements]: Omit<ReactJSXIntrinsicElements[K], 'className'> & {
      // We override class name so we can pass xcss prop to it. We opt to do this instead of
      // Making the output of cssMap() a string intersection so we can also have an inline object
      // be declared.
      /**
       * The class name prop now can be given the output of xcss prop from `@compiled/react`.
       */
      className?: string | Record<string, any> | null | false;
      css?: CssFunction<void> | CssFunction<void>[];
    };
  };
}
