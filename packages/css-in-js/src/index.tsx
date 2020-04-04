import { CSSProperties } from 'react';

export { default as Style } from '@compiled/style';
export { styled } from './styled';
export { ClassNames } from './class-names';

export type CSSProps = CSSProperties;

declare module 'react' {
  interface DOMAttributes<T> {
    css?: CSSProps | { [key: string]: CSSProps } | string;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      css?: CSSProps;
    }
  }
}
