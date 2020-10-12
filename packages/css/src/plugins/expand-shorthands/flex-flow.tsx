import { Node } from 'postcss-values-parser';
import { ConversionFunction } from './types';
import { globalValues } from './utils';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/flex-flow
 */
export const flexFlow: ConversionFunction = (node, value) => {
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
  const extactValues = (node: Node): boolean => {
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

  if (extactValues(left) || extactValues(right)) {
    return [];
  }

  return [
    node.clone({ prop: 'flex-direction', value: directionValue || 'initial' }),
    node.clone({ prop: 'flex-wrap', value: wrapValue || 'initial' }),
  ];
};
