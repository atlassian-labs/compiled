import * as CSS from 'csstype';

/**
 * Typing for the interpolations.
 */
export type TemplateInterpolations = string | number;

export type CSSProps<TValue = void> = CSS.Properties<string | number | TValue>;

export type AnyKeyCssProps<TValue> = {
  [key: string]: AnyKeyCssProps<TValue> | CSSProps<TValue> | TValue;
};

export type CssFunction<TValue = void> =
  | CSSProps<TValue>
  | AnyKeyCssProps<TValue>
  | TemplateStringsArray
  | string;

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveCompiledCss(properties: { [key: string]: string }): R;
      toHaveCompiledCss(property: string, value: string): R;
    }
  }
}
