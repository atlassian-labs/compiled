import type * as CSS from 'csstype';

import type { ApplySchemaValue } from '../create-strict-api/types';
import { ac } from '../runtime';
import type { CSSPseudos, CSSPseudoClasses, CSSProperties, StrictCSSProperties } from '../types';

type MarkAsRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type XCSSValue<
  TStyleDecl extends keyof CSSProperties,
  TSchema,
  TPseudoKey extends CSSPseudoClasses | ''
> = {
  [Q in keyof StrictCSSProperties]: Q extends TStyleDecl
    ? ApplySchemaValue<TSchema, Q, TPseudoKey>
    : never;
};

type XCSSPseudo<
  TAllowedProperties extends keyof StrictCSSProperties,
  TAllowedPseudos extends CSSPseudos,
  TRequiredProperties extends { requiredProperties: TAllowedProperties },
  TSchema
> = {
  [Q in CSSPseudos]?: Q extends TAllowedPseudos
    ? MarkAsRequired<
        XCSSValue<TAllowedProperties, TSchema, Q extends CSSPseudoClasses ? Q : ''>,
        TRequiredProperties['requiredProperties']
      >
    : never;
};

type XCSSMediaQuery<
  TAllowedProperties extends keyof StrictCSSProperties,
  TAllowedPseudos extends CSSPseudos,
  TAllowedMediaQueries extends string,
  TSchema
> = {
  [Q in `@media ${TAllowedMediaQueries}`]?:
    | XCSSValue<TAllowedProperties, TSchema, ''>
    | XCSSPseudo<TAllowedProperties, TAllowedPseudos, never, TSchema>;
};

/**
 * These APIs we don't want to allow to be passed through the `xcss` prop but we also
 * must declare them so the (lack-of a) excess property check doesn't bite us and allow
 * unexpected values through.
 */
type BlockedRules<TMode extends 'loose' | 'strict'> = {
  // To ensure styles that aren't allowed through XCSS prop strict APIs we block any
  // loose media queries from being passed through as we can't ensure they're correct.
  '@media [loose]'?: TMode extends 'loose' ? any : never;
  selectors?: never;
} & {
  // We also block all type level at rule "objects" that are present on cssMap.
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
    : CompiledPropertyDeclarationReference & TObject[Q];
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
 *   xcss: XCSSProp<XCSSAllProperties, '&:hover', { requiredProperties: 'color' }>;
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
  TAllowedProperties extends keyof StrictCSSProperties,
  TAllowedPseudos extends CSSPseudos,
  TRequiredProperties extends {
    requiredProperties: TAllowedProperties;
  } = never
> = Internal$XCSSProp<
  TAllowedProperties,
  TAllowedPseudos,
  string,
  object,
  TRequiredProperties,
  'loose'
>;

export type Internal$XCSSProp<
  TAllowedProperties extends keyof StrictCSSProperties,
  TAllowedPseudos extends CSSPseudos,
  TAllowedMediaQueries extends string,
  TSchema,
  TRequiredProperties extends {
    requiredProperties: TAllowedProperties;
  },
  TMode extends 'loose' | 'strict'
> =
  | (MarkAsRequired<
      XCSSValue<TAllowedProperties, TSchema, ''>,
      TRequiredProperties['requiredProperties']
    > &
      XCSSPseudo<TAllowedProperties, TAllowedPseudos, TRequiredProperties, TSchema> &
      XCSSMediaQuery<TAllowedProperties, TAllowedPseudos, TAllowedMediaQueries, TSchema> &
      BlockedRules<TMode>)
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
