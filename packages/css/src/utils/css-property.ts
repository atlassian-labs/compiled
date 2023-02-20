const unitless = {
  animationIterationCount: true,
  basePalette: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  fontSizeAdjust: true,
  fontWeight: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  WebkitLineClamp: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true,
};

// https://www.w3.org/TR/css-values-4/
export const units = [
  // font relative lengths
  'em',
  'ex',
  'cap',
  'ch',
  'ic',
  'rem',
  'lh',
  'rlh',

  // viewport percentage lengths
  'vw',
  'vh',
  'vi',
  'vb',
  'vmin',
  'vmax',

  // absolute lengths
  'cm',
  'mm',
  'Q',
  'in',
  'pc',
  'pt',
  'px',

  // angle units
  'deg',
  'grad',
  'rad',
  'turn',

  // duration units
  's',
  'ms',

  // frequency units
  'Hz',
  'kHz',

  // resolution units
  'dpi',
  'dpcm',
  'dppx',
  'x',

  // https://www.w3.org/TR/css-grid-1/#fr-unit
  'fr',

  // percentages
  '%',
];

const isUnitlessProperty = (propertyName: string): boolean => {
  return propertyName in unitless;
};

/**
 * Will append `'px'` to a property value if the property is not unitless.
 * This is to replicate how Emotion handles this.
 *
 * @param name CSS property name
 * @param value CSS property value
 */
export function addUnitIfNeeded(
  name: string,
  value: null | undefined | boolean | string | number
): any {
  if (value == null || typeof value === 'boolean' || value === '') {
    return '';
  }

  if (typeof value === 'number' && value !== 0 && !isUnitlessProperty(name)) {
    return `${value}px`; // Presumes implicit 'px' suffix for unitless numbers
  }

  return String(value).trim();
}
