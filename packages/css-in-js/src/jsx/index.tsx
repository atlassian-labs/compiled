import { ElementType, ReactNode } from 'react';
import { CSSProp } from './types';
import { createSetupError } from '../utils/error';

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
  throw createSetupError();
}
