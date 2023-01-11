import type { Node, Numeric, Word, Func } from 'postcss-values-parser';

/**
 * Common global values
 */
export const globalValues = ['inherit', 'initial', 'unset', 'revert', 'revert-layer'];

// According to the spec, the default value of flex-basis is 0.
// However, '0%' is used by major browsers due to compatibility issues
// https://github.com/w3c/csswg-drafts/issues/5742
export const flexBasisDefaultValue = '0%';

/**
 * Returns `true` if the node is a color,
 * else `false`.
 *
 * @param node
 */
export const isColor = (node: Node): boolean => {
  return (node.type === 'word' || node.type === 'func') && node.isColor;
};

const widthUnits = new Set([
  '%',
  'cap',
  'ch',
  'cm',
  'em',
  'ex',
  'fr',
  'ic',
  'in',
  'lh',
  'mm',
  'pc',
  'pt',
  'px',
  'Q',
  'rem',
  'rlh',
  'vb',
  'vh',
  'vi',
  'vmax',
  'vmin',
  'vw',
]);

/**
 * Returns `true` if the node is a width,
 * else `false`.
 *
 * @param node
 */
export const isWidth = (node: Node): boolean => {
  if (node.type === 'numeric') {
    if (widthUnits.has(node.unit)) {
      return true;
    } else if (node.unit === '' && node.value === '0') {
      return true;
    }
  }

  if (
    node.type === 'word' &&
    [...globalValues, 'auto', 'min-content', 'max-content', 'fit-content'].includes(node.value)
  ) {
    return true;
  }

  if (node.type === 'func') {
    // We don't want to be strict about functions, as we don't know the return type
    return true;
  }

  return false;
};

/**
 * Returns calculated width of a node.
 *
 * @param node
 */
export const getWidth = (node: Numeric | Word | Func): string => {
  if (node.type === 'numeric') {
    if (node.value === '0' && node.unit === '') {
      return flexBasisDefaultValue;
    }
    return `${node.value}${node.unit}`;
  }

  if (node.type === 'func') {
    return `${node.name}${node.params}`;
  }

  return node.value;
};
