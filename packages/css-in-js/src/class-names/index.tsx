import { ReactNode } from 'react';
import { ObjectLiteralCSS } from '../types';
import { createSetupError } from '../utils/error';

export type CSSFunction = (css: ObjectLiteralCSS) => string;

export interface ClassNamesProps {
  children: (opts: { css: CSSFunction; style: { [key: string]: string } }) => ReactNode;
}

export function ClassNames(_: ClassNamesProps): JSX.Element {
  throw createSetupError();
}
