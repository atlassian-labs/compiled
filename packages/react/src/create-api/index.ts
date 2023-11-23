import type { CSSProperties, CSSPseudos } from '../types';
import { createSetupError } from '../utils/error';
import type { CompiledStyles } from '../xcss-prop';

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
  cssMap<
    TStyles extends Record<
      string,
      Record<string, never> & CSSProperties & PseudosDeclarations & TSchema
    >
  >(
    styles: TStyles
  ): {
    readonly [P in keyof TStyles]: CompiledStyles<TStyles[P]>;
  };
}

type CompiledSchema = CSSProperties & PseudosDeclarations;

/**
 * ## createAPI
 */
export function createAPI<TSchema extends CompiledSchema>(): CompiledAPI<EnforceSchema<TSchema>> {
  return {
    css() {
      throw createSetupError();
    },
    cssMap() {
      throw createSetupError();
    },
  };
}
