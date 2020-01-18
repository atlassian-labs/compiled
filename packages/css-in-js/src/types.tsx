import { CSSProperties } from 'react';

export type ObjectLiteralCSS<TExtraProps = CSSProperties> =
  | TemplateStringsArray
  | CSSProperties
  | { [key: string]: TExtraProps | CSSProperties };

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveCompiledCss(properties: { [key: string]: string }): R;
      toHaveCompiledCss(property: string, value: string): R;
    }
  }
}
