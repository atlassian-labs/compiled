import type { Node } from 'postcss-values-parser';

import type { ConversionFunction } from './types';
import { globalValues } from './utils';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/flex-flow
 */
export const flexFlow: ConversionFunction = (value) => {
  const [left, right] = value.nodes;
  const directionValues = [...globalValues, 'row', 'row-reverse', 'column', 'column-reverse'];
  const wrapValues = [...globalValues, 'nowrap', 'wrap', 'reverse'];
  let directionValue = '';
  let wrapValue = '';

  /**
   * Extracts values from a node and mutates variables in scope.
   * If it returns `true` we should bail out and return no nodes.
   *
   * @param node
   */
  const extractValues = (node: Node): boolean => {
    if (node && node.type === 'word') {
      if (directionValues.includes(node.value)) {
        if (directionValue !== '') {
          // Invalid - already set!
          return true;
        }

        directionValue = node.value;
      } else if (wrapValues.includes(node.value)) {
        if (wrapValue !== '') {
          // Invalid - already set!
          return true;
        }

        wrapValue = node.value;
      } else {
        // Invalid
        return true;
      }
    }

    return false;
  };

  if (extractValues(left) || extractValues(right)) {
    return [];
  }

  return [
    { prop: 'flex-direction', value: directionValue || 'row' },
    { prop: 'flex-wrap', value: wrapValue || 'nowrap' },
  ];
};
