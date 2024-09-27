import {
  createStrictAPI,
  type CSSPseudos,
  type StrictCSSProperties,
  type XCSSAllProperties,
  type XCSSAllPseudos,
} from '@compiled/react';

type SpaceMargin =
  | 'var(--ds-space-0)'
  | 'var(--ds-space-025)'
  | 'var(--ds-space-050)'
  | 'auto'
  | '0 auto'
  | '0';

type MediaQuery =
  // "media.above" breakpoints
  '(min-width: 30rem)' | '(min-width: 48rem)';

interface DesignTokenStyles {
  margin: SpaceMargin;
  marginBlock: SpaceMargin;
  marginBlockEnd: SpaceMargin;
  marginBlockStart: SpaceMargin;
  marginBottom: SpaceMargin;
  zIndex: 100 | 200 | 300 | 400 | 500 | 510 | 600 | 700 | 800;
}

const { XCSSProp, css, cssMap, cx } = createStrictAPI<DesignTokenStyles, { media: MediaQuery }>();

export { css, cssMap, cx, type XCSSAllProperties, type XCSSAllPseudos };

type LocalXCSSProp<
  TAllowedProperties extends keyof StrictCSSProperties,
  TAllowedPseudos extends CSSPseudos,
  TRequiredProperties extends {
    requiredProperties: TAllowedProperties;
    requiredPseudos: TAllowedPseudos;
  } = never
> = ReturnType<typeof XCSSProp<TAllowedProperties, TAllowedPseudos, TRequiredProperties>>;

export type StrictXCSSProp<
  TAllowedProperties extends keyof StrictCSSProperties,
  TAllowedPseudos extends CSSPseudos,
  TRequiredProperties extends {
    requiredProperties: TAllowedProperties;
    requiredPseudos: TAllowedPseudos;
  } = never
> = LocalXCSSProp<TAllowedProperties, TAllowedPseudos, TRequiredProperties>;
