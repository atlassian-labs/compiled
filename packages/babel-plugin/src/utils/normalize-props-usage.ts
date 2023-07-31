import type { Binding, NodePath } from '@babel/traverse';
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

    // Skip over any default parameters when traversing,
    // otherwise they mess up the recursion
    if (t.isAssignmentPattern(node)) {
      return buildObjectChain(parentPath, currentChain);
    }

    // e.g. an arrow function like
    // ({ a: [, second] }) => ...
    if (t.isArrayPattern(node)) {
      throw new Error(
        'Compiled does not support arrays given in the parameters of an arrow function.'
      );
    }

    if (t.isObjectProperty(node) && t.isIdentifier(node.key)) {
      currentChain.unshift(node.key.name);
    }

    // When the listKey of the current path is 'params', this means
    // that the current path === the entire props object (e.g. { a, b = 5 }).
    // So we stop recursively traversing after we pass this point.
    //
    // (Note that we are recursing upwards two parents at a time.)
    if (parentPath.listKey !== 'params') {
      return buildObjectChain(parentPath.parentPath, currentChain);
    }
  }

  currentChain.unshift(PROPS_IDENTIFIER_NAME);

  return currentChain;
};

/**
 * Given an object pattern (e.g. { width, height = 16 }) from the
 * parameters of an arrow function, return an object with the
 * default parameters (if any) found. For example, { height: 16 }.
 *
 * @param path a deconstructed object within the function parameters
 * @returns an object where the keys are arguments with default
 *          parameters, and the values are their default values
 */
const getDefaultParameters = (
  path: NodePath<t.Identifier | t.RestElement | t.Pattern>
): Record<string, t.Expression> => {
  const node = path.node;
  if (!t.isObjectPattern(node)) return {};

  const assignments: Record<string, t.Expression> = {};

  const FindAllAssignmentsVisitor = {
    AssignmentPattern(path: NodePath<t.AssignmentPattern>) {
      const { node } = path;
      if (t.isIdentifier(node.left)) {
        assignments[node.left.name] = node.right;
      }
    },
  };

  path.traverse(FindAllAssignmentsVisitor);
  return assignments;
};

const normalizeDestructuredString = (
  node: t.Identifier,
  path: NodePath<t.ArrowFunctionExpression>
): void => {
  path.scope.getBinding(node.name)?.referencePaths.forEach((reference) => {
    reference.replaceWith(t.identifier(PROPS_IDENTIFIER_NAME));
  });
};

const normalizeDestructuredObject = (
  bindings: Record<string, Binding>,
  values: Record<string, t.Expression>,
  destructedPaths: Record<string, NodePath<t.Identifier>>
): void => {
  for (const key in destructedPaths) {
    const binding = bindings[key];

    if (binding.references) {
      const objectChain = buildObjectChain(destructedPaths[key]);

      binding.referencePaths.forEach((reference) => {
        const defaultValue = values[key];
        if (defaultValue) {
          // Handle default parameter
          //
          // Note that this differs from default parameters, in that
          // passing null to the function will still result in the
          // default value being used.
          reference.replaceWith(
            t.logicalExpression('??', t.identifier(objectChain.join('.')), defaultValue)
          );
        } else {
          reference.replaceWithSourceString(objectChain.join('.'));
        }
      });
    }
  }
};

const arrowFunctionVisitor = {
  ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
    const [propsParam] = path.get('params');

    if (propsParam) {
      const { node } = propsParam;

      if (t.isIdentifier(node) && node.name !== PROPS_IDENTIFIER_NAME) {
        normalizeDestructuredString(node, path);
      } else if (t.isObjectPattern(node)) {
        // We need to destructure a props parameter, i.e. the parameter
        // of a function like
        // ({ width, height = 16 }) => `${height}px ${width}px`

        const destructedPaths: Record<
          string,
          NodePath<t.Identifier>
          // @ts-expect-error
          // Property 'getBindingIdentifierPaths' does not exist on type 'NodePath<Identifier | RestElement | Pattern>'.
          // But available since v6.20.0
          // https://github.com/babel/babel/pull/4876
        > = propsParam.getBindingIdentifierPaths();

        const { bindings } = path.scope;
        const values = getDefaultParameters(propsParam);

        normalizeDestructuredObject(bindings, values, destructedPaths);
      } else if (t.isAssignmentPattern(node)) {
        // e.g. ({ a, b } = { a: 100, b: 200 }) => `${a}px ${b}px`
        throw new Error('TODO not implemented');
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
