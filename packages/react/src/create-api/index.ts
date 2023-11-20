import type { CSSProperties, CSSPseudos } from '../types';
import { createSetupError } from '../utils/error';

type PseudosDeclarations = {
  [Q in CSSPseudos]?: CSSProperties;
};

type CompiledSchema<TObject> = {
  [P in keyof TObject]?: P extends keyof Schema
    ? TObject[P] extends Record<string, unknown>
      ? CompiledSchema<TObject[P]>
      : TObject[P]
    : never;
};

interface CompiledAPI<TSchema> {
  css(props: CSSProperties & PseudosDeclarations & TSchema): CSSProperties;
}

interface Schema extends CSSProperties, PseudosDeclarations {}

/**
 * Hello world
 */
export function createAPI<TSchema extends Schema>(): CompiledAPI<CompiledSchema<TSchema>> {
  return {
    css() {
      throw createSetupError();
    },
  };
}
