import type { CSSProperties, CSSPseudos } from '../types';
import { createSetupError } from '../utils/error';

type PseudosDeclarations = {
  [Q in CSSPseudos]?: CSSProperties;
};

interface CompiledAPI<TSchema> {
  css(props: CSSProperties & PseudosDeclarations & TSchema): CSSProperties;
}

interface Schema extends CSSProperties, PseudosDeclarations {}

/**
 * Hello world
 */
export function createAPI<TSchema extends Schema>(): CompiledAPI<{
  [P in keyof TSchema]?: P extends keyof Schema ? TSchema[P] : never;
}> {
  return {
    css() {
      throw createSetupError();
    },
  };
}
