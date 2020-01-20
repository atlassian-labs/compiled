import { ElementType, ReactNode } from 'react';
import { CSSProp } from './types';

declare module 'react' {
  interface DOMAttributes<T> {
    css?: CSSProp | { [key: string]: CSSProp } | string;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      css?: CSSProp;
    }
  }
}

export function jsx<P extends {}>(_: ElementType<P>, __: P, ...___: ReactNode[]) {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`@compiled/css-in-js

You need to apply the typescript transformer to use this!
You can apply it from \`@compiled/css-in-js/ts-transformer\`.`);
  }
}
