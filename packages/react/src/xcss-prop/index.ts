import type * as CSS from 'csstype';

import { ax } from '../runtime';
import type { CSSPseudos } from '../types';

type CSSProperties = Readonly<CSS.PropertiesFallback<number | string>>;

type CSSPseudoRule = { [Q in CSSPseudos]?: CSSProperties };

type XCSSItem<TStyleDecl extends keyof CSSProperties> = {
  [Q in keyof CSSProperties]: Q extends TStyleDecl
    ? CompiledPropertyDeclarationReference | string | number
    : never;
};

type XCSSPseudos<K extends keyof CSSProperties, TPseudos extends CSSPseudos> = {
  [Q in CSSPseudos]?: Q extends TPseudos ? XCSSItem<K> : never;
};

/**
 * We currently block all at rules from xcss prop.
 * This needs us to decide on what the final API is across Compiled to be able to set.
 */
type XCSSAtRules = {
  [Q in CSS.AtRules]?: never;
};

export type CSSRuleDefinition = CSSProperties & CSSPseudoRule;

declare const __classref: unique symbol;
export type CompiledPropertyDeclarationReference = { [__classref]: true };

export type CompiledStyles<TObject> = {
  [Q in keyof TObject]: TObject[Q] extends Record<string, unknown>
    ? CompiledStyles<TObject[Q]>
    : CompiledPropertyDeclarationReference;
};

export type XCSSAllProperties = keyof CSSProperties;

export type XCSSAllPseudos = CSSPseudos;

export type XCSSProp<
  TAllowedProperties extends keyof CSSProperties,
  TAllowedPseudos extends CSSPseudos
> =
  | (XCSSItem<TAllowedProperties> & XCSSPseudos<TAllowedProperties, TAllowedPseudos> & XCSSAtRules)
  | false
  | null
  | undefined;

export const cx = <TStyles extends [...XCSSProp<any, any>[]]>(
  ...styles: TStyles
): TStyles[number] & string => {
  // Types won't match here as type-time are always objects.
  // At runtime however they will be an array of strings.
  return ax(styles as unknown as string[]) as TStyles[number] & string;
};
