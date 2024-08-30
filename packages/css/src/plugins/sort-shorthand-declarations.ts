import { shorthandFor } from '@compiled/utils';
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
};

const sortNodes = (a: ChildNode, b: ChildNode): number => {
  const aDecl = findDeclaration(a);
  const bDecl = findDeclaration(b);

  // Don't worry about any array of declarations, this would  be something like a group of AtRule versus a regular Rule
  // Those are sorted elsewhere…
  if (Array.isArray(aDecl) || Array.isArray(bDecl)) return 0;

  if (!aDecl?.prop || !bDecl?.prop) return 0;

  const aShorthand = shorthandFor[aDecl.prop];
  if (aShorthand === true || aShorthand?.includes(bDecl.prop)) {
    return -1;
  }

  const bShorthand = shorthandFor[bDecl.prop];
  if (bShorthand === true || bShorthand?.includes(aDecl.prop)) {
    return 1;
  }

  return 0;
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
