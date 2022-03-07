import type { Node } from 'postcss-values-parser';

import type { ConversionFunction } from './types';
import { globalValues, isColor } from './utils';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/outline
 */
export const outline: ConversionFunction = (value) => {
  const [left, middle, right] = value.nodes;
  const styleValues = [
    ...globalValues,
    'auto',
    'none',
    'dotted',
    'dashed',
    'solid',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
  ];
  const sizeValues = ['thin', 'medium', 'thick'];
  let colorValue: Node | string = '';
  let styleValue: Node | string = '';
  let widthValue: Node | string = '';

  /**
   * Extracts values from a node and mutates variables in scope.
   * If it returns `true` we should bail out and return no nodes.
   *
   * @param node
   */
  const extractValues = (node: Node): boolean => {
    if (node && node.type === 'word') {
      if (isColor(node)) {
        if (colorValue !== '') {
          // It has already been set - invalid!
          return true;
        }

        colorValue = node.value;
      } else if (sizeValues.includes(node.value)) {
        if (widthValue !== '') {
          // It has already been set - invalid!
          return true;
        }

        widthValue = node.value;
      } else if (styleValues.includes(node.value)) {
        if (styleValue !== '') {
          // It has already been set - invalid!
          return true;
        }

        styleValue = node.value;
      } else {
        // Invalid
        return true;
      }
    } else if (node && node.type === 'numeric') {
      if (widthValue !== '') {
        // It has already been set - invalid!
        return true;
      }

      widthValue = node;
    }

    return false;
  };

  if (extractValues(left) || extractValues(middle) || extractValues(right)) {
    return [];
  }

  return [
    { prop: 'outline-color', value: colorValue || 'currentColor' },
    { prop: 'outline-style', value: styleValue || 'none' },
    { prop: 'outline-width', value: widthValue || 'medium' },
  ];
};
