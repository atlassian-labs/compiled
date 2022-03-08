import type { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/padding
 */
export const padding: ConversionFunction = (value) => {
  const [top, right = top, bottom = top, left = right] = value.nodes;

  return [
    { prop: 'padding-top', value: top.toString() },
    { prop: 'padding-right', value: right.toString() },
    { prop: 'padding-bottom', value: bottom.toString() },
    { prop: 'padding-left', value: left.toString() },
  ];
};
