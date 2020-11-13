// TODO: REMOVE THIS EXPORT
export { CS, CC, ax } from './runtime';
// END TODO
export { styled } from './styled';
export { ClassNames } from './class-names';
import { CssFunction } from './types';

declare module 'react' {
  interface DOMAttributes<T> {
    css?: CssFunction | CssFunction[];
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      css?: CssFunction | CssFunction[];
    }
  }
}
