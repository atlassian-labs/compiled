import { CssFunction } from './types';

export { CS, CC, CT, useMode } from '@compiled/style';
export { styled } from './styled';
export { ClassNames } from './class-names';
export { createThemeProvider } from './theme';

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
