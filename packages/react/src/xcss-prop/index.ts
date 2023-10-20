import type * as CSS from 'csstype';

import type { CSSPseudos } from '../types';

type CSSProperties = Readonly<CSS.PropertiesFallback<number | string>>;

type CSSPseudoRule = { [Q in CSSPseudos]?: CSSProperties };

declare const __classref: unique symbol;

type XCSSItem<TStyleDecl extends keyof CSSProperties> = {
  [Q in keyof CSSProperties]: Q extends TStyleDecl ? CompiledStyleClassReference : never;
};

type XCSSPseudos<K extends keyof CSSProperties, TPseudos extends CSSPseudos> = {
  [Q in CSSPseudos]?: Q extends TPseudos ? XCSSItem<K> : never;
};

export type CSSRuleDefinition = CSSProperties & CSSPseudoRule;

export type CompiledStyleClassReference = { [__classref]: true };

export type CompiledStyles<TObject> = {
  [Q in keyof TObject]: TObject[Q] extends Record<string, unknown>
    ? CompiledStyles<TObject[Q]>
    : CompiledStyleClassReference;
};

export type AllCSSProperties = keyof CSSProperties;

export type AllPseudos = CSSPseudos;

export type XCSSProp<AllowedProperties extends keyof CSSProperties, TPseudos extends CSSPseudos> = (
  | (XCSSItem<AllowedProperties> & XCSSPseudos<AllowedProperties, TPseudos>)
  | false
  | null
  | undefined
) &
  string;

export const cx = <TStyles extends [...XCSSProp<any, any>[]]>(
  ..._css: TStyles
): TStyles[number] => {
  // Pass through to let the current compiled css prop handle.
  return _css as never as TStyles[number];
};
