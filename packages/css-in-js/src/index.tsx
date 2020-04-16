import { CSSProperties } from 'react';

export { default as Style } from '@compiled/style';
export { styled } from './styled';
export { ClassNames } from './class-names';

export type CSSProps = CSSProperties;

export type AnyKeyCssProps = { [key: string]: AnyKeyCssProps | CSSProperties };

declare module 'react' {
  interface DOMAttributes<T> {
    css?: CSSProps | AnyKeyCssProps | string | (string | CSSProps)[];
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      css?: CSSProps;
    }
  }
}
