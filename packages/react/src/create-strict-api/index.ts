import type { StrictCSSProperties, CSSPseudos, CSSProps } from '../types';
import { createStrictSetupError } from '../utils/error';
import { type CompiledStyles, cx, type Internal$XCSSProp } from '../xcss-prop';

import type { AllowedStyles, ApplySchema, ApplySchemaMap, CompiledSchemaShape } from './types';

export interface StrictOptions {
  media: string;
}

export interface CompiledAPI<
  TSchema extends CompiledSchemaShape,
  TAllowedMediaQueries extends string
> {
  /**
   * ## CSS
   *
   * Creates styles that are statically typed and useable with other Compiled APIs.
   * For further details [read the documentation](https://compiledcssinjs.com/docs/api-css).
   *
   * This API does not currently work with XCSS prop.
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
  css<TStyles extends ApplySchema<TStyles, TSchema>>(
    styles: AllowedStyles<TAllowedMediaQueries> & TStyles
    // NOTE: This return type is deliberately not using ReadOnly<CompiledStyles<TStyles>>
    // So it type errors when used with XCSS prop. When we update the compiler to work with
    // it we can update the return type so it stops being a type violation.
  ): CSSProps<unknown>;
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
  cssMap<
    TObject extends Record<string, AllowedStyles<TAllowedMediaQueries>>,
    TStylesMap extends ApplySchemaMap<TObject, TSchema>
  >(
    styles: Record<string, AllowedStyles<TAllowedMediaQueries>> & TStylesMap
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
   *      { requiredProperties: 'color' }
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
    } = never
  >(): Internal$XCSSProp<
    TAllowedProperties,
    TAllowedPseudos,
    TAllowedMediaQueries,
    TSchema,
    TRequiredProperties,
    'strict'
  >;
}

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
 * 1. Declare the API in a module (either local or in a package), optionally declaring accepted media queries.
 *
 * @example
 * ```tsx
 * // ./foo.ts
 * interface Schema {
 *   color: 'var(--ds-text)',
 *   '&:hover': { color: 'var(--ds-text-hover)' }
 * }
 *
 * const { css, cssMap, XCSSProp, cx } = createStrictAPI<Schema, { media: '(min-width: 30rem)' }>();
 *
 * export { css, cssMap, XCSSProp, cx };
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
export function createStrictAPI<
  TSchema extends CompiledSchemaShape,
  TCreateStrictAPIOptions extends StrictOptions = never
>(): CompiledAPI<TSchema, TCreateStrictAPIOptions['media']> {
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
