import type { NodePath } from '@babel/core';
import type { Binding } from '@babel/traverse';
import * as t from '@babel/types';

import type { PluginPass } from '../types';

import { isAutomaticRuntime } from './is-automatic-runtime';
import { isCreateElement } from './is-create-element';

/**
 * Returns the children of a `jsx()` call expression.
 *
 * @param node
 * @returns
 */
const getJsxRuntimeChildren = (node: t.CallExpression): t.Expression[] => {
  const props = node.arguments[1];
  const children: t.Expression[] = [];

  if (t.isObjectExpression(props)) {
    props.properties.forEach((prop) => {
      if (t.isObjectProperty(prop) && t.isExpression(prop.value)) {
        children.push(prop.value);
      }
    });
  }

  return children;
};

/**
 * Returns the value of a binding.
 *
 * @param identifierName
 * @param parentPath
 */
const getBindingValue = (
  identifierName: string,
  parentPath: NodePath<any>
): [Binding, t.Expression] | [undefined, undefined] => {
  const binding = parentPath.scope.getBinding(identifierName);

  if (binding && t.isVariableDeclarator(binding.path.node)) {
    const value = binding.path.node.init;
    if (value !== null && value !== undefined) {
      return [binding, value];
    }
  }

  return [undefined, undefined];
};

/**
 * Will remove found style declarations tied to the passed in `node`,
 * and callback with any found.
 *
 * @param node
 * @param parentPath
 * @param pass
 */
export const removeStyleDeclarations = (
  node: t.Node,
  parentPath: NodePath<any>,
  pass: PluginPass
): void => {
  const processElement = (element: t.Expression | t.SpreadElement | null) => {
    if (!t.isIdentifier(element)) {
      return;
    }

    const [binding, bindingValue] = getBindingValue(element.name, parentPath);
    if (binding && bindingValue && t.isStringLiteral(bindingValue)) {
      pass.styleRules.push(bindingValue.value);
      binding.path.remove();
    }
  };

  if (t.isCallExpression(node) && isCreateElement(node.callee)) {
    // We've found something that looks like React.createElement(CS)
    const children = node.arguments[2];
    if (t.isArrayExpression(children)) {
      for (const element of children.elements) {
        processElement(element);
      }
    }

    return;
  }

  if (isAutomaticRuntime(node, 'jsx')) {
    // We've found something that looks like _jsx(CS)
    const [styles] = getJsxRuntimeChildren(node);

    if (t.isArrayExpression(styles)) {
      for (const element of styles.elements) {
        processElement(element);
      }
    }

    return;
  }

  if (
    t.isJSXElement(node) &&
    t.isJSXIdentifier(node.openingElement.name) &&
    node.openingElement.name.name === 'CS'
  ) {
    // We've found something that looks like <CS>
    const [styles] = node.children;
    if (t.isJSXExpressionContainer(styles) && t.isArrayExpression(styles.expression)) {
      for (const element of styles.expression.elements) {
        processElement(element);
      }
    }

    return;
  }
};
