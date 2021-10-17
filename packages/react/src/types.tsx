import type * as CSS from 'csstype';

/**
 * Typing for the interpolations.
 */
export type BasicTemplateInterpolations = string | number;

export interface FunctionIterpolation<TProps> {
  (props: TProps): CSSProps | string | number | boolean | undefined;
}

/**
 * These are all the CSS props that will exist.
 */
export type CSSProps = CSS.Properties<string | number>;

export type AnyKeyCssProps<TValue> = {
  [key: string]: AnyKeyCssProps<TValue> | CSSProps | string | number | TValue;
};

export type CssFunction<TValue = void> =
  | CSSProps
  | AnyKeyCssProps<TValue>
  | TemplateStringsArray
  | string
  | boolean
  | undefined;
