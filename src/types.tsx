import { CSSProperties } from 'react';

export type ObjectLiteralCSS<TExtraProps = CSSProperties> =
  | TemplateStringsArray
  | CSSProperties
  | { [key: string]: TExtraProps | CSSProperties };
