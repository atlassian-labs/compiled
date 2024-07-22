import type { ChildNode } from 'postcss';

// TODO: Would need a full list from https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties
// We _kind_ of have some of this in `expand-shorthands`, but only partially.
const shorthandFor: { [key: string]: string[] } = {
  font: [
    'font-style',
    'font-variant',
    'font-weight',
    'font-stretch',
    'font-size',
    'line-height',
    'font-family',
  ],
  outline: ['outline-color', 'outline-style', 'outline-width'],
};

export const sortShorthandDeclarations = (nodes: ChildNode[]): void => {
  if (!nodes?.length) return;

  // Recurse through nodes, eg. AtRules, Rules (psuedos, selectors) should also be sorted.
  nodes.forEach((node) => {
    if ('nodes' in node && node.nodes?.length) {
      sortShorthandDeclarations(node.nodes);
    }
  });

  nodes.sort((a, b) => {
    if (a.type !== 'decl' || b.type !== 'decl') return 0;
    if (!a.prop || !b.prop) return 0;

    if (shorthandFor[a.prop]?.includes(b.prop)) {
      return -1;
    }

    if (shorthandFor[b.prop]?.includes(a.prop)) {
      return 1;
    }

    return 0;
  });
};
