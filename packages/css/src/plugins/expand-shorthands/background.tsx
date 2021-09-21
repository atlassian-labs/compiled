import type { ConversionFunction } from './types';
import { isColor } from './utils';

/**
 * Only background-color is expanded.
 * https://developer.mozilla.org/en-US/docs/Web/CSS/background
 */
export const background: ConversionFunction = (value) => {
  if (value.nodes.length === 1 && isColor(value.nodes[0])) {
    return [{ prop: 'background-color', value: value.nodes[0].toString() }];
  }

  return [{ value: value.nodes.join(' ') }];
};
