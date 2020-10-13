import { ConversionFunction } from './types';
import { isWidth, getWidth } from './utils';

/**
 * https://developer.mozilla.org/en-US/docs/Web/CSS/flex
 */
export const flex: ConversionFunction = (value) => {
  const [left, middle, right] = value.nodes;
  let grow: number | string = 'auto';
  let shrink: number | string = 'initial';
  let basis: number | string = 'none';

  switch (value.nodes.length) {
    case 1: {
      if (left.type === 'numeric' && !left.unit) {
        grow = left.value;
        shrink = 1;
        basis = 0;
      }
      if (left.type === 'word' && left.value !== 'none') {
        // Invalid
        return [];
      }

      break;
    }

    case 2: {
      if (left.type === 'numeric' && !left.unit) {
        grow = left.value;
      } else {
        return [];
      }

      if (middle.type === 'numeric' && !middle.unit) {
        shrink = middle.value;
        basis = 0;
      } else if (isWidth(middle)) {
        shrink = 1;
        const value = getWidth(middle);
        if (value) {
          basis = value;
        } else {
          // Invalid
          return [];
        }
      } else {
        // Invalid
        return [];
      }

      break;
    }

    case 3: {
      if (left.type === 'numeric' && !left.unit) {
        grow = left.value;
      } else {
        return [];
      }

      if (middle.type === 'numeric' && !middle.unit) {
        shrink = middle.value;
        basis = 0;
      }

      if (isWidth(right)) {
        const value = getWidth(right);
        if (value) {
          basis = value;
        } else {
          // Invalid
          return [];
        }
      } else {
        // Invalid
        return [];
      }

      break;
    }

    default:
      // Invalid
      return [];
  }

  return [
    { prop: 'flex-grow', value: grow },
    { prop: 'flex-shrink', value: shrink },
    { prop: 'flex-basis', value: basis },
  ];
};
