import type { CSSRuleDefinition, CompiledStyleClassReference } from './xcss-prop';

type RemapToReference<TObject> = {
  [Q in keyof TObject]: TObject[Q] extends Record<string, unknown>
    ? RemapToReference<TObject[Q]>
    : CompiledStyleClassReference;
};

/**
 * __xcss__
 *
 * Used for creating type safe styles.
 *
 * @example
 * ```tsx
 * const redText = xcss({
 *   color: 'red',
 * })
 * ```
 */
export default function xcss<AllowedProperties extends CSSRuleDefinition>(
  _style: AllowedProperties
): RemapToReference<AllowedProperties> {
  /** hack to allow testing - ideally use prod only error */
  return _style as unknown as RemapToReference<AllowedProperties>;
}
