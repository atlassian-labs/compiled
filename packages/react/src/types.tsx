import type * as CSS from 'csstype';

/**
 * Typing for the interpolations.
 */
export type BasicTemplateInterpolations = string | number;

export interface FunctionInterpolation<TProps> {
  (props: TProps): CSSProps | BasicTemplateInterpolations | boolean | undefined;
}

/**
 * These are all the CSS props that will exist.
 */
export type CSSProps = CSS.Properties<BasicTemplateInterpolations>;

export type AnyKeyCssProps<TValue> = {
  [key: string]: AnyKeyCssProps<TValue> | CSSProps | BasicTemplateInterpolations | TValue;
};

export type CssFunction<TValue = void> =
  | CSSProps
  | AnyKeyCssProps<TValue>
  | TemplateStringsArray
  | string
  | boolean
  | undefined;
