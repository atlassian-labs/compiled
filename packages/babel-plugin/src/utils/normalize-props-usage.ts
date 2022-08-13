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

  return currentChain;
};

/**
 * Converts all usage of props to a normalized format
 * For example:
 *
 * `(p) => p.width`
 * `({ width }) => width`
 * `({height, ...rest}) => rest.width`
 *
 * All become
 * `(props) => props.width`
 *
 * @param styledPath Path of the CSS source
 */
export const normalizePropsUsage = (
  styledPath: NodePath<t.TaggedTemplateExpression | t.CallExpression>
): void => {
  styledPath.traverse({
    ArrowFunctionExpression(path) {
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
          const destructedValuePaths = propsParam.getBindingIdentifierPaths();

          for (const key in destructedValuePaths) {
            const binding = bindings[key];

            if (binding.references) {
              const objectChain = buildObjectChain(destructedValuePaths[key]);
              objectChain.unshift(PROPS_IDENTIFIER_NAME);

              binding.referencePaths.forEach((reference) => {
                reference.replaceWithSourceString(objectChain.join('.'));
              });
            }
          }
        }

        propsParam.replaceWith(t.identifier(PROPS_IDENTIFIER_NAME));
      }
    },
  });
};
