import { createStrictAPI } from '../../index';

type Color = 'var(--ds-text)';
type ColorHovered = 'var(--ds-text-hovered)';
type ColorPressed = 'var(--ds-text-pressed)';
type Background = 'var(--ds-bold)' | 'var(--ds-success)';
type BackgroundHovered = 'var(--ds-bold-hovered)' | 'var(--ds-success-hovered)';
type BackgroundPressed = 'var(--ds-bold-pressed)' | 'var(--ds-success-pressed)';

interface Properties {
  color: Color;
  backgroundColor: Background;
}

interface HoveredProperties extends Omit<Properties, 'backgroundColor' | 'color'> {
  color: ColorHovered;
  backgroundColor: BackgroundHovered;
}

interface PressedProperties extends Omit<Properties, 'backgroundColor' | 'color'> {
  color: ColorPressed;
  backgroundColor: BackgroundPressed;
}

interface StrictAPI extends Properties {
  '&:hover': HoveredProperties;
  '&:active': PressedProperties;
  '&::before': Properties;
  '&::after': Properties;
}

const { css, XCSSProp, cssMap, cx } = createStrictAPI<StrictAPI>();

export { css, XCSSProp, cssMap, cx };
