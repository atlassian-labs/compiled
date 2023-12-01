import type { StrictCSSProperties, CSSPseudos } from '../types';
import { createSetupError } from '../utils/error';
import { type CompiledStyles, cx, type Internal$XCSSProp } from '../xcss-prop';

type PseudosDeclarations = {
  [Q in CSSPseudos]?: StrictCSSProperties;
};

type EnforceSchema<TObject> = {
  [P in keyof TObject]?: P extends keyof CompiledSchema
    ? TObject[P] extends Record<string, unknown>
      ? EnforceSchema<TObject[P]>
      : TObject[P]
    : never;
};

type PickObjects<TObject> = {
  [P in keyof TObject]: TObject[P] extends Record<string, unknown> ? TObject[P] : never;
};

interface CompiledAPI<TSchema> {
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
  css(
    styles: StrictCSSProperties & PseudosDeclarations & EnforceSchema<TSchema>
  ): StrictCSSProperties;
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
    TStyles extends Record<
      string,
      StrictCSSProperties & PseudosDeclarations & EnforceSchema<TSchema>
    >
  >(
    styles: TStyles
  ): {
    readonly [P in keyof TStyles]: CompiledStyles<TStyles[P]>;
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
   * @example
   * ```
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
   * @example
   * ```
   * // Declared as an inline object
   * <Component xcss={{ color: 'var(--ds-text)' }} />
   *
   * // Declared with the cssMap API
   * const styles = cssMap({ text: { color: 'var(--ds-text)' } });
   * <Component xcss={styles.text} />
   * ```
   *
   * To concatenate and conditonally apply styles use the {@link cssMap} {@link cx} functions.
   */
  XCSSProp<
    TAllowedProperties extends keyof StrictCSSProperties,
    TAllowedPseudos extends CSSPseudos,
    TRequiredProperties extends {
      requiredProperties: TAllowedProperties;
      requiredPseudos: TAllowedPseudos;
    } = never
  >(): Internal$XCSSProp<
    TAllowedProperties,
    TAllowedPseudos,
    TSchema,
    PickObjects<TSchema>,
    TRequiredProperties
  >;
}

type CompiledSchema = StrictCSSProperties & PseudosDeclarations;

/**
 * ## Create Strict API
 */
export function createStrictAPI<TSchema extends CompiledSchema>(): CompiledAPI<TSchema> {
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
