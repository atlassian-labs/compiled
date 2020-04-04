import { CSSProperties } from 'react';
import { createSetupError } from '../utils/error';

export type CSS = CSSProperties;

declare module 'react' {
  interface DOMAttributes<T> {
    css?: CSS | { [key: string]: CSS } | string;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      css?: CSSProperties;
    }
  }
}

throw createSetupError();
