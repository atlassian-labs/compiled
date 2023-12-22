import type { StrictCSSProperties, CSSPseudos } from '../types';
import { createStrictSetupError } from '../utils/error';
import { type CompiledStyles, cx, type Internal$XCSSProp } from '../xcss-prop';

type PseudosDeclarations = {
  [Q in CSSPseudos]?: StrictCSSProperties;
};

type EnforceSchema<TSchema> = {
  [P in keyof TSchema]?: P extends keyof CompiledSchema
    ? TSchema[P] extends Record<string, any>
      ? EnforceSchema<TSchema[P]>
      : TSchema[P]
    : never;
};

type CSSStyles<TSchema extends CompiledSchema> = StrictCSSProperties &
  PseudosDeclarations &
  EnforceSchema<TSchema>;

type CSSMapStyles<TSchema extends CompiledSchema> = Record<string, CSSStyles<TSchema>>;

interface CompiledAPI<TSchema extends CompiledSchema> {
  /**
   * ## CSS
   *
   * Creates styles that are statically typed and useable with other Compiled APIs.
   * For further details [read the documentation](https://compiledcssinjs.com/docs/api-css).
   *
   * @example
   * ```
   * const redText = css({
   *   color: 'red',
   * });
   *
   * <div css={redText} />
   * ```
   */
  css(styles: CSSStyles<TSchema>): StrictCSSProperties;
  /**
   * ## CSS Map
   *
   * Creates a collection of named styles that are statically typed and useable with other Compiled APIs.
   * For further details [read the documentation](https://compiledcssinjs.com/docs/api-cssmap).
   *
   * @example
   * ```
   * const styles = cssMap({
   *  none: { borderStyle: 'none' },
   *  solid: { borderStyle: 'solid' },
   * });
   *
   * <div css={styles.solid} />
   * ```
   */
  cssMap<TStylesMap extends CSSMapStyles<TSchema>>(
    // We intersection type the generic both with the concrete type and the generic to ensure the output has the generic applied.
    // Without both it would either have the input arg not have excess property check kick in allowing unexpected values or
    // have all values set as the output making usage with XCSSProp have type violations unexpectedly.
    styles: CSSMapStyles<TSchema> & TStylesMap
  ): {
    readonly [P in keyof TStylesMap]: CompiledStyles<TStylesMap[P]>;
  };
  /**
   * ## CX
   *
   * Use in conjunction with the {@link XCSSProp} to concatenate and conditionally apply
   * declared styles. Can only be used with the {@link cssMap} and {@link XCSSProp} APIs.
   *
   * @example
   * ```
   * const styles = cssMap({
   *  text: { color: 'var(--ds-text)' },
   *  primary: { color: 'var(--ds-text-brand)' },
   * });
   *
   * <Component xcss={cx(isPrimary && styles.text, !isPrimary && styles.primary)} />
   * ```
   */
  cx: typeof cx;
  /**
   * ## XCSSProp
   *
   * Declare styles your component takes with all other styles marked as violations
   * by the TypeScript compiler. There are two primary use cases for xcss prop:
   *
   * - safe style overrides
   * - inverting style declarations
   *
   * Interverting style declarations is interesting for platform teams as
   * it means products only pay for styles they use as they're now the ones who declare
   * the styles!
   *
   * The {@link XCSSProp} type has generics two of which must be defined — use to explicitly
   * set want you to maintain as API. Use {@link XCSSAllProperties} and {@link XCSSAllPseudos}
   * to enable all properties and pseudos.
   *
   * The third generic is used to declare what properties and pseudos should be required.
   *
   * ```tsx
   * interface MyComponentProps {
   *   // Color is accepted, all other properties / pseudos are considered violations.
   *   xcss?: ReturnType<typeof XCSSProp<'color', never>>;
   *
   *   // Only backgrond color and hover pseudo is accepted.
   *   xcss?: ReturnType<typeof XCSSProp<'backgroundColor', '&:hover'>>;
   *
   *   // All properties are accepted, all pseudos are considered violations.
   *   xcss?: ReturnType<typeof XCSSProp<XCSSAllProperties, never>>;
   *
   *   // All properties are accepted, only the hover pseudo is accepted.
   *   xcss?: ReturnType<typeof XCSSProp<XCSSAllProperties, '&:hover'>>;
   *
   *   // The xcss prop is required as well as the color property. No pseudos are required.
   *   xcss: ReturnType<
   *    typeof XCSSProp<
   *      XCSSAllProperties,
   *      '&:hover',
   *      { requiredProperties: 'color', requiredPseudos: never }
   *     >
   *   >;
   * }
   *
   * function MyComponent({ xcss }: MyComponentProps) {
   *   return <div css={{ color: 'var(--ds-text-danger)' }} className={xcss} />
   * }
   * ```
   *
   * The xcss prop works with static inline objects and the [cssMap](https://compiledcssinjs.com/docs/api-cssmap) API.
   *
   * ```jsx
   * // Declared as an inline object
   * <Component xcss={{ color: 'var(--ds-text)' }} />
   *
   * // Declared with the cssMap API
   * const styles = cssMap({ text: { color: 'var(--ds-text)' } });
   * <Component xcss={styles.text} />
   * ```
   *
   * To concatenate and conditonally apply styles use the {@link cssMap} and {@link cx} functions.
   */
  XCSSProp<
    TAllowedProperties extends keyof StrictCSSProperties,
    TAllowedPseudos extends CSSPseudos,
    TRequiredProperties extends {
      requiredProperties: TAllowedProperties;
      requiredPseudos: TAllowedPseudos;
    } = never
  >(): Internal$XCSSProp<TAllowedProperties, TAllowedPseudos, TSchema, TRequiredProperties>;
}

type CompiledSchema = StrictCSSProperties & PseudosDeclarations;

/**
 * ## Create Strict API
 *
 * Returns a strict subset of Compiled APIs augmented by a type definition.
 * This API does not change Compileds build time behavior — merely augmenting
 * the returned API types which enforce:
 *
 * - all APIs use object types
 * - property values declared in the type definition must be used (else fallback to defaults)
 * - a strict subset of pseudo states/selectors
 * - unknown properties to be a type violation
 *
 * To set up:
 *
 * 1. Declare the API in a module (either local or in a package):
 *
 * @example
 * ```tsx
 * // ./foo.ts
 * const { css } = createStrictAPI<{
 *   color: 'var(--ds-text)',
 *   '&:hover': { color: 'var(--ds-text-hover)' }
 * }>();
 *
 * export { css };
 * ```
 *
 * 2. Configure Compiled to pick up this module:
 *
 * @example
 * ```diff
 * // .compiledcssrc
 * {
 * +  "importSources": ["./foo.ts"]
 * }
 * ```
 *
 * 3. Use the module in your application code:
 *
 * @example
 * ```tsx
 * import { css } from './foo';
 *
 * const styles = css({ color: 'var(--ds-text)' });
 *
 * <div css={styles} />
 * ```
 */
export function createStrictAPI<TSchema extends CompiledSchema>(): CompiledAPI<TSchema> {
  return {
    css() {
      throw createStrictSetupError();
    },
    cssMap() {
      throw createStrictSetupError();
    },
    cx,
    XCSSProp() {
      throw createStrictSetupError();
    },
  };
}
