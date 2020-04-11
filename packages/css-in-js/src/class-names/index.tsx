import { ReactNode, CSSProperties } from 'react';
import { createSetupError } from '../utils/error';

export type CSSFunction = (css: ObjectLiteralCSS) => string;

export type ObjectLiteralCSS<TExtraProps = CSSProperties> =
  | TemplateStringsArray
  | CSSProperties
  | string
  | (CSSProperties | TemplateStringsArray | string)[]
  | { [key: string]: TExtraProps | CSSProperties };

export interface ClassNamesProps {
  children: (opts: { css: CSSFunction; style: { [key: string]: string } }) => ReactNode;
}

export function ClassNames(_: ClassNamesProps): JSX.Element {
  throw createSetupError();
}
