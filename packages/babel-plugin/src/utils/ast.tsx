import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { State } from '../types';

/**
 * Returns the nodes path including the scope of a parent.
 * @param node
 * @param parentPath
 */
export const getPathOfNode = <TNode extends unknown>(
  node: TNode,
  parentPath: NodePath
): NodePath<TNode> => {
  let foundPath: NodePath | null = null;

  traverse(
    t.expressionStatement(node as any),
    {
      enter(path) {
        foundPath = path;
        path.stop();
      },
    },
    parentPath.scope,
    undefined,
    parentPath
  );

  if (!foundPath) {
    throw parentPath.buildCodeFrameError('No path for a child node was found.');
  }

  return foundPath;
};

/**
 * Returns `true` if the node is using `css` from `@compiled/react` as a call expression
 *
 * @param node {t.Expression} The expression node that is being checked
 * @param state {State} Plugin state
 * @returns {boolean} Whether the node is a css usage from compiled
 */
export const isCompiledCSSCallExpression = (
  node: t.Expression,
  state: State
): node is t.CallExpression =>
  t.isCallExpression(node) &&
  t.isIdentifier(node.callee) &&
  node.callee.name === state.compiledImports?.css;

/**
 * Returns `true` if the node is using `css` from `@compiled/react` as a tagged template expression
 *
 * @param node {t.Expression} The expression node that is being checked
 * @param state {State} Plugin state
 * @returns {boolean} Whether the node is a css usage from compiled
 */
export const isCompiledCSSTaggedTemplateExpression = (
  node: t.Expression,
  state: State
): node is t.TaggedTemplateExpression =>
  t.isTaggedTemplateExpression(node) &&
  t.isIdentifier(node.tag) &&
  node.tag.name === state.compiledImports?.css;

/**
 * Returns `true` if the node is using `keyframes` from `@compiled/react` as a call expression
 *
 * @param node {t.Node} The node that is being checked
 * @param state {State} Plugin state
 * @returns {boolean} Whether the node is a compiled keyframe
 */
export const isCompiledKeyframesCallExpression = (
  node: t.Node,
  state: State
): node is t.CallExpression =>
  t.isCallExpression(node) &&
  t.isIdentifier(node.callee) &&
  node.callee.name === state.compiledImports?.keyframes;

/**
 * Returns `true` if the node is using `keyframes` from `@compiled/react` as a tagged template expression
 *
 * @param node {t.Node} The node that is being checked
 * @param state {State} Plugin state
 * @returns {boolean} Whether the node is a compiled keyframe
 */
export const isCompiledKeyframesTaggedTemplateExpression = (
  node: t.Node,
  state: State
): node is t.TaggedTemplateExpression =>
  t.isTaggedTemplateExpression(node) &&
  t.isIdentifier(node.tag) &&
  node.tag.name === state.compiledImports?.keyframes;

/**
 * Returns `true` if the node is using `styled` from `@compiled/react` from a styled.tag usage
 *
 * @param node {t.Node} The node that is being checked
 * @param state {State} Plugin state
 * @returns {boolean} Whether the node is a styled usage from compiled
 */
const isCompiledStyledMemberExpression = (node: t.Node, state: State): node is t.MemberExpression =>
  t.isMemberExpression(node) &&
  t.isIdentifier(node.object) &&
  node.object.name === state.compiledImports?.styled;

/**
 * Returns `true` if the node is using `styled` from `@compiled/react` from a styled(Component) usage
 *
 * @param node {t.Node} The node that is being checked
 * @param state {State} Plugin state
 * @returns {boolean} Whether the node is a styled usage from compiled
 */
const isCompiledStyledCompositionCallExpression = (
  node: t.Node,
  state: State
): node is t.CallExpression =>
  t.isCallExpression(node) &&
  t.isIdentifier(node.callee) &&
  node.callee.name === state.compiledImports?.styled;

/**
 * Returns `true` if the node is using `styled` from `@compiled/react` as a call expression
 *
 * @param node {t.Expression} The expression node that is being checked
 * @param state {State} Plugin state
 * @returns {boolean} Whether the node is a styled usage from compiled
 */
export const isCompiledStyledCallExpression = (
  node: t.Expression,
  state: State
): node is t.CallExpression =>
  t.isCallExpression(node) &&
  (isCompiledStyledMemberExpression(node.callee, state) ||
    isCompiledStyledCompositionCallExpression(node.callee, state));

/**
 * Returns `true` if the node is using `styled` from `@compiled/react` as a tagged template expression
 *
 * @param node {t.Node} The node that is being checked
 * @param state {State} Plugin state
 * @returns {boolean} Whether the node is a styled usage from compiled
 */
export const isCompiledStyledTaggedTemplateExpression = (
  node: t.Node,
  state: State
): node is t.TaggedTemplateExpression =>
  t.isTaggedTemplateExpression(node) &&
  (isCompiledStyledMemberExpression(node.tag, state) ||
    isCompiledStyledCompositionCallExpression(node.tag, state));

/**
 * Builds a code frame error from a passed in node.
 *
 * @param error
 * @param node
 * @param parentPath
 */
export const buildCodeFrameError = (
  error: string,
  node: t.Node | null,
  parentPath: NodePath<any>
): Error => {
  if (!node) {
    throw parentPath.buildCodeFrameError(error);
  }

  const startLoc = node.loc ? ` (${node.loc.start.line}:${node.loc.start.column})` : '';

  return getPathOfNode(node, parentPath).buildCodeFrameError(`${error}${startLoc}.`);
};

/**
 * Will return either the name of an identifier or the value of a string literal.
 *
 * E.g:
 * - `foo` identifier node will return `"foo"`,
 * - `"bar"` string literal node will return `"bar"`.
 *
 * @param node
 */
export const getKey = (node: t.Expression): string => {
  if (t.isIdentifier(node)) {
    return node.name;
  }

  if (t.isStringLiteral(node)) {
    return node.value;
  }

  throw new Error(`${node.type} has no name.'`);
};

/**
 * Will wrap BlockStatement or Expression in an IIFE,
 * Looks like (() => { return 10; })().
 *
 * @param node Node of type either BlockStatement or Expression
 */
export const wrapNodeInIIFE = (node: t.BlockStatement | t.Expression): t.CallExpression =>
  t.callExpression(t.arrowFunctionExpression([], node), []);

const tryWrappingBlockStatementInIIFE = (node: t.BlockStatement | t.Expression) =>
  t.isBlockStatement(node) ? wrapNodeInIIFE(node) : node;

/**
 * Will pick `Function` body and tries to wrap it in an IIFE if
 * its a BlockStatement otherwise returns the picked body,
 * E.g.
 * `props => props.color` would end up as `props.color`.
 * `props => { return props.color; }` would end up as `(() => { return props.color })()`
 * `function () { return props.color; }` would end up as `(function () { return props.color })()`
 *
 * @param node Node of type ArrowFunctionExpression
 */
export const pickFunctionBody = (node: t.Function): t.Expression =>
  tryWrappingBlockStatementInIIFE(node.body);
