import type * as CSS from 'csstype';

import type { Pseudos as CSSPseudos } from './pseudos';

export type CSSRuleDefinition = CSSProperties & CSSPseudoRule;

type CSSProperties = Readonly<CSS.PropertiesFallback<number | string>>;

type CSSPseudoRule = { [Q in CSSPseudos]?: CSSProperties };

declare const __classref: unique symbol;
export type CompiledStyleClassReference = { [__classref]: true };

type XCSSItem<TStyleDecl extends keyof CSSProperties> = {
  [Q in keyof CSSProperties]: Q extends TStyleDecl ? CompiledStyleClassReference : never;
};

type XCSSPseudos<K extends keyof CSSProperties, TPseudos extends CSSPseudos> = {
  [Q in CSSPseudos]?: Q extends TPseudos ? XCSSItem<K> : never;
};

/** xcss prop public api */
export type XCSSProp<AllowedProperties extends keyof CSSProperties, TPseudos extends CSSPseudos> =
  | (XCSSItem<AllowedProperties> & XCSSPseudos<AllowedProperties, TPseudos>)
  | false
  | null
  | undefined;
