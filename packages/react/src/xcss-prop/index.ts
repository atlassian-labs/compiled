import type * as CSS from 'csstype';

import { ac } from '../runtime';
import type { CSSPseudos, CSSProperties, StrictCSSProperties } from '../types';

type MarkAsRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type XCSSItem<TStyleDecl extends keyof CSSProperties, TSchema> = {
  [Q in keyof CSSProperties]: Q extends TStyleDecl
    ?
        | CompiledPropertyDeclarationReference
        | (Q extends keyof TSchema ? TSchema[Q] : CSSProperties[Q])
    : never;
};

type XCSSPseudos<
  TAllowedProperties extends keyof CSSProperties,
  TAllowedPseudos extends CSSPseudos,
  TRequiredProperties extends { requiredProperties: TAllowedProperties },
  TSchema
> = {
  [Q in CSSPseudos]?: Q extends TAllowedPseudos
    ? MarkAsRequired<
        XCSSItem<TAllowedProperties, Q extends keyof TSchema ? TSchema[Q] : object>,
        TRequiredProperties['requiredProperties']
      >
    : never;
};

/**
 * These APIs we don't want to allow to be passed through the `xcss` prop but we also
 * must declare them so the (lack-of a) excess property check doesn't bite us and allow
 * unexpected values through.
 */
type BlockedRules = {
  selectors?: never;
} & {
  /**
   * We currently block all at rules from xcss prop.
   * This needs us to decide on what the final API is across Compiled to be able to set.
   */
  [Q in CSS.AtRules]?: never;
};

type CompiledPropertyDeclarationReference = {
  ['__COMPILED_PROPERTY_DECLARATION_REFERENCE_DO_NOT_WRITE_DIRECTLY__']: true;
};

/**
 * Used to mark styles that have been flushed through an API as being generated
 * from Compiled. This is useful when you want other ends of the API to ensure they
 * take Compiled generated styles and not some arbitrary object.
 */
export type CompiledStyles<TObject> = {
  [Q in keyof TObject]: TObject[Q] extends Record<string, unknown>
    ? CompiledStyles<TObject[Q]>
    : CompiledPropertyDeclarationReference;
};

/**
 * Please think twice before using this type, you're better off declaring explicitly
 * what your API should be, for example only defining `"color"`.
 *
 * Use in conjunction with {@link XCSSProp} to allow all properties to be given to
 * your component.
 */
export type XCSSAllProperties = keyof StrictCSSProperties;

/**
 * Please think twice before using this type, you're better off declaring explicitly
 * what your API should be, for example not allowing any pseudos at all using the
 * `never` type.
 *
 * Use in conjunction with {@link XCSSProp} to allow all pseudos to be given to
 * your component.
 */
export type XCSSAllPseudos = CSSPseudos;

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
 *   xcss?: XCSSProp<'color', never>;
 *
 *   // Only backgrond color and hover pseudo is accepted.
 *   xcss?: XCSSProp<'backgroundColor', '&:hover'>;
 *
 *   // All properties are accepted, all pseudos are considered violations.
 *   xcss?: XCSSProp<XCSSAllProperties, never>;
 *
 *   // All properties are accepted, only the hover pseudo is accepted.
 *   xcss?: XCSSProp<XCSSAllProperties, '&:hover'>;
 *
 *   // The xcss prop is required as well as the color property. No pseudos are required.
 *   xcss: XCSSProp<XCSSAllProperties, '&:hover', { requiredProperties: 'color', requiredPseudos: never }>;
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
export type XCSSProp<
  TAllowedProperties extends keyof CSSProperties,
  TAllowedPseudos extends CSSPseudos,
  TRequiredProperties extends {
    requiredProperties: TAllowedProperties;
    requiredPseudos: TAllowedPseudos;
  } = never
> = Internal$XCSSProp<TAllowedProperties, TAllowedPseudos, object, TRequiredProperties>;

export type Internal$XCSSProp<
  TAllowedProperties extends keyof CSSProperties,
  TAllowedPseudos extends CSSPseudos,
  TSchema,
  TRequiredProperties extends {
    requiredProperties: TAllowedProperties;
    requiredPseudos: TAllowedPseudos;
  }
> =
  | (MarkAsRequired<
      XCSSItem<TAllowedProperties, TSchema>,
      TRequiredProperties['requiredProperties']
    > &
      MarkAsRequired<
        XCSSPseudos<TAllowedProperties, TAllowedPseudos, TRequiredProperties, TSchema>,
        TRequiredProperties['requiredPseudos']
      > &
      BlockedRules)
  | false
  | null
  | undefined;

/**
 * ## CX
 *
 * Use in conjunction with the {@link XCSSProp} to concatenate and conditionally apply
 * declared styles. Can only be used with the `cssMap()` and {@link XCSSProp} APIs.
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
export const cx = <TStyles extends [...XCSSProp<any, any>[]]>(
  ...styles: TStyles
): TStyles[number] => {
  // At runtime TStyles is resolved down to strings, but not at compile time.
  // We circumvent the type system here because of that.
  const actualStyles = styles as unknown as string[];

  // The output should be a union type of passed in styles. This ensures the call
  // site of xcss prop can raise violations when disallowed styles have been passed.
  return ac(actualStyles) as TStyles[number];
};
