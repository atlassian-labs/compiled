import type { CSSPropertiesStrict, CSSPseudos } from '../types';
import { createSetupError } from '../utils/error';
import type { Internal$XCSSProp } from '../xcss-prop';

type PseudosDeclarations = {
  [Q in CSSPseudos]?: CSSPropertiesStrict;
};

type CompiledSchema = CSSPropertiesStrict & PseudosDeclarations;

type EnforceSchema<TObject, TShape> = {
  [P in keyof TObject]?: P extends keyof CompiledSchema
    ? TObject[P] extends Record<string, unknown>
      ? EnforceSchema<TObject[P], TShape>
      : TObject[P]
    : never;
};

declare global {
  /* eslint-disable @typescript-eslint/no-empty-interface */

  /**
   * Description goes brr
   */
  interface CompiledTypedProperty {}

  /**
   * Description goes brr
   */
  interface CompiledTypedPseudo {}
  /* eslint-enable @typescript-eslint/no-empty-interface */
}

/**
 * Description goes brr
 */
export type XCSSProp<
  TAllowedProperties extends keyof CSSPropertiesStrict,
  TAllowedPseudos extends CSSPseudos,
  TRequiredProperties extends {
    requiredProperties: TAllowedProperties;
    requiredPseudos: TAllowedPseudos;
  } = never
> = Internal$XCSSProp<
  TAllowedProperties,
  TAllowedPseudos,
  CompiledTypedProperty,
  CompiledTypedPseudo,
  TRequiredProperties
>;

/**
 * Description goes brr
 */
export function css(
  _styles: CSSPropertiesStrict &
    PseudosDeclarations &
    EnforceSchema<CompiledTypedProperty, CSSPropertiesStrict> &
    EnforceSchema<CompiledTypedPseudo, PseudosDeclarations>
): CSSPropertiesStrict {
  throw createSetupError();
}
