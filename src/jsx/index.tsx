import { createElement, ElementType, ReactNode } from 'react';
import './types';
import { name as packageName } from '../../package.json';

export const IS_CSS_FREEDOM_COMPILED = false;

export default function<P extends {}>(type: ElementType<P>, props: P, ...children: ReactNode[]) {
  if (process.env.NODE_ENV !== 'production' && !IS_CSS_FREEDOM_COMPILED) {
    throw new Error(`${packageName}

You need to apply the typescript transformer to use this!
You can apply it from \`${packageName}/transformer\`.`);
  }

  return createElement(type, props, ...children);
}
