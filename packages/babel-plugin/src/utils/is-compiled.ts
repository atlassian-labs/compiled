import * as t from '@babel/types';

import type { State } from '../types';

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
