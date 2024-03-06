import { createStrictAPI } from '../../index';

type Color = 'var(--ds-text)';
type ColorHovered = 'var(--ds-text-hovered)';
type ColorPressed = 'var(--ds-text-pressed)';
type Background = 'var(--ds-bold)' | 'var(--ds-success)';
type BackgroundHovered = 'var(--ds-bold-hovered)' | 'var(--ds-success-hovered)';
type BackgroundPressed = 'var(--ds-bold-pressed)' | 'var(--ds-success-pressed)';
type Space = 'var(--ds-space-050)' | 'var(--ds-space-0)';

interface Properties {
  color: Color;
  backgroundColor: Background;
  padding: Space;
}

interface HoveredProperties {
  color: ColorHovered;
  backgroundColor: BackgroundHovered;
}

interface PressedProperties {
  color: ColorPressed;
  backgroundColor: BackgroundPressed;
}

interface CSSPropertiesSchema extends Properties {
  '&:hover': HoveredProperties;
  '&:active': PressedProperties;
}

const { css, cssMap, cx, XCSSProp } = createStrictAPI<CSSPropertiesSchema>();

export { css, XCSSProp, cssMap, cx };
