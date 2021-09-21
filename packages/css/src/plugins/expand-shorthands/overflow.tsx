import type { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
 */
export const overflow: ConversionFunction = (value) => {
  const [overflowX, overflowY = overflowX] = value.nodes;

  return [
    { prop: 'overflow-x', value: overflowX.toString() },
    { prop: 'overflow-y', value: overflowY.toString() },
  ];
};
