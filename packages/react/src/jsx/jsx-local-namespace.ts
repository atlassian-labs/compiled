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
type ReactJSXElementAttributesProperty = JSX.ElementAttributesProperty;
type ReactJSXElementChildrenAttribute = JSX.ElementChildrenAttribute;
type ReactJSXLibraryManagedAttributes<C, P> = JSX.LibraryManagedAttributes<C, P>;
type ReactJSXIntrinsicAttributes = JSX.IntrinsicAttributes;
type ReactJSXIntrinsicClassAttributes<T> = JSX.IntrinsicClassAttributes<T>;
type ReactJSXIntrinsicElements = JSX.IntrinsicElements;

export namespace CompiledJSX {
  export type ElementType = ReactJSXElementType;
  export type Element = ReactJSXElement;
  export type ElementClass = ReactJSXElementClass;
  export type ElementAttributesProperty = ReactJSXElementAttributesProperty;
  export type ElementChildrenAttribute = ReactJSXElementChildrenAttribute;
  export type LibraryManagedAttributes<C, P> = WithConditionalCSSProp<P> &
    ReactJSXLibraryManagedAttributes<C, P>;
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
