import type { CSSProperties, CSSPseudos } from '../types';
import { createSetupError } from '../utils/error';
import { type CompiledStyles, cx, type Internal$XCSSProp } from '../xcss-prop';

type PseudosDeclarations = {
  [Q in CSSPseudos]?: CSSProperties;
};

type EnforceSchema<TObject> = {
  [P in keyof TObject]?: P extends keyof CompiledSchema
    ? TObject[P] extends Record<string, unknown>
      ? EnforceSchema<TObject[P]>
      : TObject[P]
    : never;
};

interface CompiledAPI<TSchema> {
  css(styles: CSSProperties & PseudosDeclarations & TSchema): CSSProperties;
  cssMap<TStyles extends Record<string, CSSProperties & PseudosDeclarations & TSchema>>(
    styles: TStyles
  ): {
    readonly [P in keyof TStyles]: CompiledStyles<TStyles[P]>;
  };
  cx: typeof cx;
  XCSSProp<
    TAllowedProperties extends keyof CSSProperties,
    TAllowedPseudos extends CSSPseudos,
    TRequiredProperties extends {
      requiredProperties: TAllowedProperties;
      requiredPseudos: TAllowedPseudos;
    } = never
  >(): Internal$XCSSProp<TAllowedProperties, TAllowedPseudos, TSchema, object, TRequiredProperties>;
}

type CompiledSchema = CSSProperties & PseudosDeclarations;

/**
 * ## createAPI
 */
export function createStrictAPI<TSchema extends CompiledSchema>(): CompiledAPI<
  EnforceSchema<TSchema>
> {
  return {
    css() {
      throw createSetupError();
    },
    cssMap() {
      throw createSetupError();
    },
    cx,
    XCSSProp() {
      throw createSetupError();
    },
  };
}
