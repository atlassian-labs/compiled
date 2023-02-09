import type { Node, Numeric, Word, Func } from 'postcss-values-parser';

/**
 * Common global values
 */
export const globalValues = ['inherit', 'initial', 'unset', 'revert', 'revert-layer'];

/**
 * Returns `true` if the node is a color,
 * else `false`.
 *
 * @param node
 */
export const isColor = (node: Node): boolean => {
  if ((node.type === 'word' || node.type === 'func') && node.isColor) return true;

  // https://drafts.csswg.org/css-color/#named-colors two special words aren't included in `isColor`
  return node.type === 'word' && ['transparent', 'currentcolor'].includes(node.value);
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
  if (node.type === 'numeric' && widthUnits.has(node.unit)) {
    return true;
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
    return `${node.value}${node.unit}`;
  }

  if (node.type === 'func') {
    return `${node.name}${node.params}`;
  }

  return node.value;
};
