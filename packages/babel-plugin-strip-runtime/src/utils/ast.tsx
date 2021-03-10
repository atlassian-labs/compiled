import * as t from '@babel/types';
import type { NodePath } from '@babel/core';
import type { Binding } from '@babel/traverse';
import type { PluginPass } from '../types';

/**
 * Returns `true` if `node` looks like `React.createElement()`.
 *
 * @param node
 * @returns
 */
export const isCreateElement = (node: t.Node): node is t.CallExpression => {
  return (
    t.isMemberExpression(node) &&
    t.isIdentifier(node.object) &&
    node.object.name === 'React' &&
    t.isIdentifier(node.property) &&
    node.property.name === 'createElement'
  );
};

/**
 * Returns `true` if `node` looks like a `jsx()` like call expression.
 *
 * @param node
 * @param func
 * @returns
 */
export const isAutomaticRuntime = (
  node: t.Node,
  func: 'jsx' | 'jsxs'
): node is t.CallExpression => {
  if (t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === `_${func}`) {
    return true;
  }

  if (
    t.isCallExpression(node) &&
    t.isSequenceExpression(node.callee) &&
    t.isMemberExpression(node.callee.expressions[1]) &&
    t.isIdentifier(node.callee.expressions[1].property) &&
    node.callee.expressions[1].property.name === func
  ) {
    return true;
  }

  return false;
};

/**
 * Returns the children of a `jsx()` call expression.
 *
 * @param node
 * @returns
 */
export const getJsxRuntimeChildren = (node: t.CallExpression): Array<t.Expression> => {
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
 * Returns `true` if `node` looks like `CC` identifier.
 *
 * @param node
 * @returns
 */
export const isCCComponent = (node: t.Node): boolean => {
  if (t.isIdentifier(node) && node.name === 'CC') {
    return true;
  }

  if (t.isMemberExpression(node) && t.isIdentifier(node.property) && node.property.name === 'CC') {
    return true;
  }

  return false;
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
): [Binding, t.Expression | null | undefined] => {
  const binding = parentPath.scope.getBinding(identifierName);
  if (binding && t.isVariableDeclarator(binding.path.node)) {
    const value = binding.path.node.init;
    return [binding, value];
  }

  throw new Error('Binding not found.');
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
  if (t.isCallExpression(node) && isCreateElement(node.callee)) {
    // We've found something that looks like React.createElement(CS)
    const children = node.arguments[2];
    if (t.isArrayExpression(children)) {
      children.elements.forEach((value) => {
        if (!t.isIdentifier(value)) {
          return;
        }

        const [binding, bindingValue] = getBindingValue(value.name, parentPath);
        if (bindingValue && t.isStringLiteral(bindingValue)) {
          pass.opts.onFoundStyleSheet && pass.opts.onFoundStyleSheet(bindingValue.value);
          binding.path.remove();
        }
      });
    }

    return;
  }

  if (isAutomaticRuntime(node, 'jsx')) {
    // We've found something that looks like _jsx(CS)
    const [styles] = getJsxRuntimeChildren(node);

    if (t.isArrayExpression(styles)) {
      styles.elements.forEach((value) => {
        if (!t.isIdentifier(value)) {
          return;
        }

        const [binding, bindingValue] = getBindingValue(value.name, parentPath);
        if (bindingValue && t.isStringLiteral(bindingValue)) {
          pass.opts.onFoundStyleSheet && pass.opts.onFoundStyleSheet(bindingValue.value);
          binding.path.remove();
        }
      });
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
      styles.expression.elements.forEach((value) => {
        if (!t.isIdentifier(value)) {
          return;
        }

        const [binding, bindingValue] = getBindingValue(value.name, parentPath);
        if (bindingValue && t.isStringLiteral(bindingValue)) {
          pass.opts.onFoundStyleSheet && pass.opts.onFoundStyleSheet(bindingValue.value);
          binding.path.remove();
        }
      });
    }

    return;
  }
};
