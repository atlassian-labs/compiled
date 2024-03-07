import type {
  StrictCSSProperties,
  CSSPseudoClasses,
  CSSPseudoElements,
  CSSPseudos,
} from '../types';

/**
 * This is the shape of the generic object that `createStrictAPI()` takes.
 * It's deliberately a subset of `AllowedStyles` and does not take at rules
 * and pseudo elements.
 */
export type CompiledSchemaShape = StrictCSSProperties & {
  [Q in CSSPseudoClasses]?: StrictCSSProperties;
};

export type PseudosDeclarations = { [Q in CSSPseudos]?: StrictCSSProperties };

export type MediaQueries<TMediaQuery extends string> = {
  [Q in `@media ${TMediaQuery}`]?: StrictCSSProperties & PseudosDeclarations;
};

export type AllowedStyles<TMediaQuery extends string> = StrictCSSProperties &
  PseudosDeclarations &
  MediaQueries<TMediaQuery>;

export type ApplySchemaValue<
  TSchema,
  TKey extends keyof StrictCSSProperties,
  TPseudoKey extends CSSPseudoClasses | ''
> = TKey extends keyof TSchema
  ? // TKey is a valid property on the schema
    TPseudoKey extends keyof TSchema
    ? TKey extends keyof TSchema[TPseudoKey]
      ? // We found a more specific value under TPseudoKey.
        TSchema[TPseudoKey][TKey]
      : // Did not found anything specific, use the top level TSchema value.
        TSchema[TKey]
    : // Did not found anything specific, use the top level TSchema value.
      TSchema[TKey]
  : // TKey wasn't found on the schema, fallback to the CSS property value
    StrictCSSProperties[TKey];

/**
 * Recursively maps over object properties to resolve them to either a {@link TSchema}
 * value if present, else fallback to its value from {@link StrictCSSProperties}. If
 * the property isn't a known property its value will be resolved to `never`.
 */
export type ApplySchema<TObject, TSchema, TPseudoKey extends CSSPseudoClasses | '' = ''> = {
  [TKey in keyof TObject]?: TKey extends keyof StrictCSSProperties
    ? // TKey is a valid CSS property, try to resolve its value.
      ApplySchemaValue<TSchema, TKey, TPseudoKey>
    : TKey extends CSSPseudoClasses
    ? // TKey is a valid pseudo class, recursively resolve its child properties
      // while passing down the parent pseudo key to resolve any specific schema types.
      ApplySchema<TObject[TKey], TSchema, TKey>
    : TKey extends `@${string}` | CSSPseudoElements
    ? // TKey is either an at rule or a pseudo element, either way we don't care about
      // passing down the key so we recursively resolve its child properties starting at
      // the base schema, treating it as if it's not inside an object.
      ApplySchema<TObject[TKey], TSchema>
    : // Fallback case, did not find a valid CSS property, at rule, or pseudo.
      // Resolve the value to `never` which will end up being a type violation.
      never;
};

export type ApplySchemaMap<TStylesMap, TSchema> = {
  [P in keyof TStylesMap]: ApplySchema<TStylesMap[P], TSchema>;
};
