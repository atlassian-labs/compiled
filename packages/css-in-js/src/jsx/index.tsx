import { createElement, ElementType, ReactNode } from 'react';
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

export const IS_CSS_FREEDOM_COMPILED = false;

export function jsx<P extends {}>(type: ElementType<P>, props: P, ...children: ReactNode[]) {
  if (process.env.NODE_ENV !== 'production' && !IS_CSS_FREEDOM_COMPILED) {
    throw new Error(`@compiled/css-in-js

You need to apply the typescript transformer to use this!
You can apply it from \`@compiled/css-in-js/ts-transformer\`.`);
  }

  return createElement(type, props, ...children);
}
