import type { ChildNode, Numeric, Word, Func } from 'postcss-values-parser';

import type { ConversionFunction } from './types';
import { getWidth, isWidth } from './utils';

// According to the spec, the default value of flex-basis is 0.
// However, '0%' is used by major browsers due to compatibility issues
// https://github.com/w3c/csswg-drafts/issues/5742
const flexBasisDefaultValue = '0%';

const isFlexNumber = (node: ChildNode): node is Numeric => node.type === 'numeric' && !node.unit;
const isFlexBasis = (node: ChildNode): node is Numeric | Word | Func =>
  (node.type === 'word' && node.value === 'content') ||
  (node.type === 'numeric' && node.unit === '' && node.value === '0') ||
  isWidth(node);

const getBasisWidth = (node: Numeric | Word | Func) =>
  node.type === 'numeric' && node.value === '0' && node.unit === ''
    ? flexBasisDefaultValue
    : getWidth(node);

/**
 * https://drafts.csswg.org/css-flexbox-1/#flex-property
 */
export const flex: ConversionFunction = (value) => {
  const [left, middle, right] = value.nodes;

  switch (value.nodes.length) {
    case 1: {
      if (left.type === 'word') {
        if (left.value === 'auto') {
          // `flex: 'auto'` is equivalent to `flex: '1 1 auto'`
          return [
            { prop: 'flex-grow', value: 1 },
            { prop: 'flex-shrink', value: 1 },
            { prop: 'flex-basis', value: 'auto' },
          ];
        }
        if (left.value === 'none') {
          // `flex: 'none'` is equivalent to `flex: '0 0 auto'`
          return [
            { prop: 'flex-grow', value: 0 },
            { prop: 'flex-shrink', value: 0 },
            { prop: 'flex-basis', value: 'auto' },
          ];
        }
        if (left.value === 'initial') {
          // `flex: 'initial'` is equivalent to `flex: '0 1 auto'`
          return [
            { prop: 'flex-grow', value: 0 },
            { prop: 'flex-shrink', value: 1 },
            { prop: 'flex-basis', value: 'auto' },
          ];
        }

        if (
          left.value === 'revert' ||
          left.value === 'revert-layer' ||
          left.value === 'unset' ||
          left.value === 'inherit'
        ) {
          // Early exit, simply `flex: 'inherit'` (etc)
          // NOTE: This doesn't even take this `value`, simply omitting the `prop` key is the early exit
          return [{ value: left.value }];
        }
      } else if (isFlexNumber(left)) {
        // the value should map to `flex-grow`
        return [
          { prop: 'flex-grow', value: left.value },
          { prop: 'flex-shrink', value: 1 },
          { prop: 'flex-basis', value: flexBasisDefaultValue },
        ];
      } else if (isFlexBasis(left)) {
        // we assume that the value should map to `flex-basis`
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
          { prop: 'flex-basis', value: getBasisWidth(right) },
        ];
      }
      break;
    }
  }

  // Invalid CSS
  return [];
};
