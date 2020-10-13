import { ConversionFunction } from './types';
import { isColor } from './utils';

/**
 * Only background-color is expanded.
 * https://developer.mozilla.org/en-US/docs/Web/CSS/background
 */
export const background: ConversionFunction = (node, value) => {
  if (value.nodes.length === 1 && isColor(value.nodes[0])) {
    return [node.clone({ prop: 'background-color', value: value.nodes[0] })];
  }

  const orderedValues = value.nodes
    .map((val) => val.toString())
    .sort()
    .join(' ');

  return [
    node.clone({
      value: orderedValues,
    }),
  ];
};
