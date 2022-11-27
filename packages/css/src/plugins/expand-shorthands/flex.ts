import type { ChildNode, Numeric, Word, Func } from 'postcss-values-parser';

import type { ConversionFunction } from './types';
import { getWidth, isWidth } from './utils';

const isFlexNumber = (node: ChildNode): node is Numeric => node.type === 'numeric' && !node.unit;
const isFlexBasis = (node: ChildNode): node is Numeric | Word | Func =>
  (node.type === 'word' && node.value === 'content') || isWidth(node);

// According to the spec, the default value of flex-basis is 0.
// However, '0%' is used by major browsers due to compatibility issues
// https://github.com/w3c/csswg-drafts/issues/5742
const flexBasisDefaultValue = '0%';

/**
 * https://drafts.csswg.org/css-flexbox-1/#flex-property
 */
export const flex: ConversionFunction = (value) => {
  const [left, middle, right] = value.nodes;

  switch (value.nodes.length) {
    case 1: {
      if (left.type === 'word' && left.value == 'none') {
        // none is equivalent to 0 0 auto
        return [
          { prop: 'flex-grow', value: 0 },
          { prop: 'flex-shrink', value: 0 },
          { prop: 'flex-basis', value: 'auto' },
        ];
      } else if (isFlexNumber(left)) {
        // flex grow
        return [
          { prop: 'flex-grow', value: left.value },
          { prop: 'flex-shrink', value: 1 },
          { prop: 'flex-basis', value: flexBasisDefaultValue },
        ];
      } else if (isFlexBasis(left)) {
        // flex basis
        return [
          { prop: 'flex-grow', value: 1 },
          { prop: 'flex-shrink', value: 1 },
          { prop: 'flex-basis', value: getWidth(left) },
        ];
      }
      break;
    }

    case 2: {
      if (isFlexNumber(left)) {
        if (isFlexNumber(middle)) {
          // flex grow and flex shrink
          return [
            { prop: 'flex-grow', value: left.value },
            { prop: 'flex-shrink', value: middle.value },
            { prop: 'flex-basis', value: flexBasisDefaultValue },
          ];
        } else if (isFlexBasis(middle)) {
          // flex grow and flex basis
          return [
            { prop: 'flex-grow', value: left.value },
            { prop: 'flex-shrink', value: 1 },
            { prop: 'flex-basis', value: getWidth(middle) },
          ];
        }
      }
      break;
    }

    case 3: {
      if (isFlexNumber(left) && isFlexNumber(middle) && isFlexBasis(right)) {
        // flex grow, flex shrink, and flex basis
        return [
          { prop: 'flex-grow', value: left.value },
          { prop: 'flex-shrink', value: middle.value },
          { prop: 'flex-basis', value: getWidth(right) },
        ];
      }
      break;
    }
  }

  // Invalid CSS
  return [];
};
