export { styled } from './styled';
export { ClassNames } from './class-names';
export { Global } from './global';
import { CssFunction } from './types';

declare module 'react' {
  interface DOMAttributes<T> {
    css?: CssFunction | CssFunction[];
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      /**
       * Use `css` prop to have more control over a component that has styles tied to an element.
       *
       * It is enabled when any usage of the `@compiled/react` module is found,
       * for example when using the `styled` API it will be enabled.
       *
       * ```
       * css={{ fontSize: 12 }} // Object CSS
       * css={`font-size: 12px;`} // Template literal CSS
       * css={[{ fontSize: 12 }, `font-size: 12px;`]} // Array CSS
       * ```
       *
       * For more help, read the docs:
       * https://compiledcssinjs.com/docs/css-prop
       */
      css?: CssFunction | CssFunction[];
    }
  }
}
