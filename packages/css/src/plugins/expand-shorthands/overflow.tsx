import { ConversionFunction } from './types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
 */
export const overflow: ConversionFunction = (node, value) => {
  const [overflowX, overflowY = overflowX] = value.nodes;

  return [
    node.clone({ prop: 'overflow-x', value: overflowX }),
    node.clone({ prop: 'overflow-y', value: overflowY }),
  ];
};
