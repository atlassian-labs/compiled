import type { StrictCSSProperties, CSSPseudoClasses, CSSPseudos } from '../types';

export type CompiledSchema = StrictCSSProperties & {
  [Q in CSSPseudoClasses]?: StrictCSSProperties;
};

export type PseudosDeclarations = { [Q in CSSPseudos]?: StrictCSSProperties };

export type AllowedStyles = StrictCSSProperties & PseudosDeclarations;

export type ApplySchemaValue<
  TSchema,
  TKey extends keyof StrictCSSProperties,
  TPseudoKey extends CSSPseudoClasses | ''
> = TKey extends keyof TSchema
  ? TPseudoKey extends keyof TSchema
    ? TKey extends keyof TSchema[TPseudoKey]
      ? TSchema[TPseudoKey][TKey]
      : TSchema[TKey]
    : TSchema[TKey]
  : StrictCSSProperties[TKey];

export type ApplySchema<TObject, TSchema, TPseudoKey extends CSSPseudoClasses | '' = ''> = {
  [TKey in keyof TObject]?: TKey extends keyof StrictCSSProperties
    ? ApplySchemaValue<TSchema, TKey, TPseudoKey>
    : TKey extends CSSPseudoClasses
    ? ApplySchema<TObject[TKey], TSchema, TKey>
    : ApplySchema<TObject[TKey], TSchema>;
};
