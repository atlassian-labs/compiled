import { shorthandBuckets, type ShorthandProperties } from '@compiled/utils';
import type { ChildNode, Declaration } from 'postcss';

const nodeIsDeclaration = (node: ChildNode): node is Declaration => node.type === 'decl';

const findDeclaration = (node: ChildNode): Declaration | Declaration[] | undefined => {
  if (nodeIsDeclaration(node)) {
    return node;
  }

  if ('nodes' in node) {
    if (node.nodes.length === 1 && nodeIsDeclaration(node.nodes[0])) {
      return node.nodes[0];
    }

    const declarations = node.nodes.map(findDeclaration).filter(Boolean) as Declaration[];

    if (declarations.length === 1) {
      return declarations[0];
    }

    return declarations;
  }

  return undefined;
};

const sortNodes = (a: ChildNode, b: ChildNode): number => {
  const aDecl = findDeclaration(a);
  const bDecl = findDeclaration(b);

  // Don't worry about any array of declarations, this would be something like a group of
  // AtRule versus a regular Rule.
  //
  // Those are sorted elsewhere…
  if (Array.isArray(aDecl) || Array.isArray(bDecl)) return 0;

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
