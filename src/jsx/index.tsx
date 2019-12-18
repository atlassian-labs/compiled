import { createElement, ElementType, ReactNode, CSSProperties } from 'react';
import { CSSProp } from './types';
import { name as packageName } from '../../package.json';

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
    throw new Error(`${packageName}

You need to apply the typescript transformer to use this!
You can apply it from \`${packageName}/transformer\`.`);
  }

  return createElement(type, props, ...children);
}
