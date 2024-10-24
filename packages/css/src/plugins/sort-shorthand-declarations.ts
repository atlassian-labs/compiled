import { shorthandBuckets, type ShorthandProperties } from '@compiled/utils';
import type { ChildNode, Declaration } from 'postcss';

const nodeIsDeclaration = (node: ChildNode): node is Declaration => node.type === 'decl';

const findDeclaration = (node: ChildNode): Declaration | undefined => {
  if (nodeIsDeclaration(node)) {
    return node;
  }

  if ('nodes' in node) {
    // Return the first node that is a declaration, if we find one
    return node.nodes.find(nodeIsDeclaration);
  }

  return undefined;
};

const sortNodes = (a: ChildNode, b: ChildNode): number => {
  // NOTE: These return the first declaration when the class has multiple properties
  // eg. `-webkit-text-decoration:initial;text-decoration:initial` would sort
  // against `-webkit-text-decoration`, which may not be perfect in all cases
  const aDecl = findDeclaration(a);
  const bDecl = findDeclaration(b);

  // This will probably happen because we have an AtRule being compared to a regular
  // Rule. Don't try to sort this - the *contents* of the AtRule will be traversed and
  // sorted by sortShorthandDeclarations, and the sort-at-rules plugin will sort AtRules
  // so they come after regular rules.
  if (!aDecl?.prop || !bDecl?.prop) return 0;

  // Why default to Infinity? Because if the property is not a shorthand property,
  // we want it to come after all of the other shorthand properties.
  const aShorthandBucket = shorthandBuckets[aDecl.prop as ShorthandProperties] ?? Infinity;
  const bShorthandBucket = shorthandBuckets[bDecl.prop as ShorthandProperties] ?? Infinity;

  // Ensures a deterministic sorting of shorthand properties in the case where those
  // shorthand properties overlap.
  //
  // For example, `border-top` and `border-color` are not shorthand properties of
  // each other, BUT both properties are shorthand versions of `border-top-color`.
  // If `border-top` is in bucket 4 and `border-color` is in bucket 2, we can ensure
  // that `border-color` always comes before `border-top`.
  return aShorthandBucket - bShorthandBucket;
};

export const sortShorthandDeclarations = (nodes: ChildNode[]): void => {
  if (!nodes?.length) return;

  // Recurse through nodes, eg. AtRules, Rules (psuedos, selectors) should also be sorted.
  nodes.forEach((node) => {
    if ('nodes' in node && node.nodes?.length) {
      sortShorthandDeclarations(node.nodes);
    }
  });

  nodes.sort(sortNodes);
};
