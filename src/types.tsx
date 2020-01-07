import { CSSProperties } from 'react';

export type ObjectLiteralCSS<TExtraProps = CSSProperties> =
  | TemplateStringsArray
  | CSSProperties
  | { [key: string]: TExtraProps | CSSProperties };

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveCssRule(property: string, value: any): R;
    }
  }
}
