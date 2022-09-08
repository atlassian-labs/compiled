import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import { PROPS_IDENTIFIER_NAME } from '../constants';

/**
 * Recursively restructures an object chain from destructured param
 * Starts from the lowest end of the chain
 *
 * @param path Current NodePath in the chain
 * @param currentChain String array of chained properties
 */
const buildObjectChain = (path: NodePath<t.Node> | null, currentChain: string[] = []): string[] => {
  if (path?.listKey !== 'params' && path?.parentPath) {
    const { parentPath } = path;
    const { node } = parentPath;

    if (t.isObjectProperty(node) && t.isIdentifier(node.key)) {
      currentChain.unshift(node.key.name);
    }

    return buildObjectChain(parentPath.parentPath, currentChain);
  }

  currentChain.unshift(PROPS_IDENTIFIER_NAME);

  return currentChain;
};

const arrowFunctionVisitor = {
  ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
    const [propsParam] = path.get('params');

    if (propsParam) {
      const { node } = propsParam;

      if (t.isIdentifier(node) && node.name !== PROPS_IDENTIFIER_NAME) {
        path.scope.getBinding(node.name)?.referencePaths.forEach((reference) => {
          reference.replaceWith(t.identifier(PROPS_IDENTIFIER_NAME));
        });
        // If destructuring
      } else if (t.isObjectPattern(node)) {
        const { bindings } = path.scope;
        // @ts-expect-error
        // getBindingIdentifierPaths not in @babel/traverse types
        // But available since v6.20.0
        // https://github.com/babel/babel/pull/4876
        const destructedPaths = propsParam.getBindingIdentifierPaths();

        for (const key in destructedPaths) {
          const binding = bindings[key];

          if (binding.references) {
            const objectChain = buildObjectChain(destructedPaths[key]);

            binding.referencePaths.forEach((reference) => {
              reference.replaceWithSourceString(objectChain.join('.'));
            });
          }
        }
      }

      propsParam.replaceWith(t.identifier(PROPS_IDENTIFIER_NAME));
    }
  },
};

/**
 * Converts all usage of props to a normalized format
 * For example:
 *
 * `(p) => p.width`
 * `({ width }) => width`
 * `({ width: w }) => w`
 * `({height, ...rest}) => rest.width`
 *
 * All become
 * `(props) => props.width`
 *
 * @param styledPath Path of the CSS source
 */
export const normalizePropsUsage = (
  styledPath: NodePath<t.TaggedTemplateExpression> | NodePath<t.CallExpression>
): void => {
  styledPath.traverse(arrowFunctionVisitor);
};
