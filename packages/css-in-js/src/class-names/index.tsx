import { ReactNode } from 'react';
import { ObjectLiteralCSS } from '../types';

export const IS_CSS_FREEDOM_COMPILED = false;

type CSSFunction = (css: ObjectLiteralCSS) => string;

interface ClassNamesProps {
  children: (opts: { css: CSSFunction; style: { [key: string]: string } }) => ReactNode;
}

export function ClassNames(_: ClassNamesProps) {
  if (process.env.NODE_ENV !== 'production' && !IS_CSS_FREEDOM_COMPILED) {
    throw new Error(`@compiled/css-in-js

You need to apply the typescript transformer to use this!
You can apply it from \`@compiled/css-in-js/ts-transformer\`.`);
  }

  return undefined as any;
}
