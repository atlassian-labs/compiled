import type { Node } from 'postcss-values-parser';

import type { ConversionFunction } from './types';
import { globalValues, isColor } from './utils';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration
 */
export const textDecoration: ConversionFunction = (value) => {
  const [left, middle, right] = value.nodes;
  const lineValues = [...globalValues, 'none', 'underline', 'overline', 'line-through', 'blink'];
  const styleValues = [...globalValues, 'solid', 'double', 'dotted', 'dashed', 'wavy'];
  const lineValue: string[] = [];
  let colorValue = '';
  let styleValue = '';

  /**
   * Extracts values from a node and mutates variables in scope.
   * If it returns `true` we should bail out and return no nodes.
   *
   * @param node
   */
  const extractValues = (node: Node): boolean => {
    if (node && node.type === 'word') {
      if (lineValues.includes(node.value)) {
        if (lineValue.length === 0 || !lineValue.includes(node.value)) {
          lineValue.push(node.value);
        } else {
          // Invalid, bail out!
          return true;
        }
      } else if (isColor(node)) {
        colorValue = node.value;
      } else if (styleValues.includes(node.value)) {
        styleValue = node.value;
      }
    }

    return false;
  };

  if (extractValues(left) || extractValues(middle) || extractValues(right)) {
    return [];
  }

  lineValue.sort(); // Ensure the sorting is always in the same order.
  const resolvedLineValue = lineValue.length ? lineValue.join(' ') : 'none';

  return [
    { prop: 'text-decoration-color', value: colorValue || 'currentColor' },
    { prop: 'text-decoration-line', value: resolvedLineValue },
    { prop: 'text-decoration-style', value: styleValue || 'solid' },
  ];
};
