import { CSSProperties } from 'react';

export type ObjectLiteralCSS =
  | TemplateStringsArray
  | CSSProperties
  | { [key: string]: CSSProperties };
