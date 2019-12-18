import { ReactNode } from 'react';
import { ObjectLiteralCSS } from '../types';
import { name as packageName } from '../../package.json';

export const IS_CSS_FREEDOM_COMPILED = false;

type CSSFunction = (css: ObjectLiteralCSS) => string;

interface ClassNamesProps {
  children: (opts: { css: CSSFunction; style: { [key: string]: string } }) => ReactNode;
}

export function ClassNames(props: ClassNamesProps) {
  if (process.env.NODE_ENV !== 'production' && !IS_CSS_FREEDOM_COMPILED) {
    throw new Error(`${packageName}

You need to apply the typescript transformer to use this!
You can apply it from \`${packageName}/transformer\`.`);
  }

  return undefined as any;
}
