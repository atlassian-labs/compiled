import type { CSSRuleDefinition, CompiledStyleClassReference } from './xcss';

type RemapToReference<TObject> = {
  [Q in keyof TObject]: TObject[Q] extends Record<string, unknown>
    ? RemapToReference<TObject[Q]>
    : CompiledStyleClassReference;
};

export default function xcss<AllowedProperties extends CSSRuleDefinition>(
  _style: AllowedProperties
): RemapToReference<AllowedProperties> {
  throw new Error('No runtime');
}
