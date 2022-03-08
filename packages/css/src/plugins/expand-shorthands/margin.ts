import type { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/margin
 */
export const margin: ConversionFunction = (value) => {
  const [top, right = top, bottom = top, left = right] = value.nodes;

  return [
    { prop: 'margin-top', value: top.toString() },
    { prop: 'margin-right', value: right.toString() },
    { prop: 'margin-bottom', value: bottom.toString() },
    { prop: 'margin-left', value: left.toString() },
  ];
};
