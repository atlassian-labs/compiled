import * as t from '@babel/types';
import traverse, { NodePath, Binding } from '@babel/traverse';
import { parse } from '@babel/parser';
import fs from 'fs';
import path from 'path';
import resolve from 'resolve';
import { Metadata } from '../types';

/**
 * Returns the nodes path including the scope of a parent.
 * @param node
 * @param parentPath
 */
export const getPathOfNode = <TNode extends {}>(
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
 * Builds a code frame error from a passed in node.
 *
 * @param error
 * @param node
 * @param parentPath
 */
export const buildCodeFrameError = (error: string, node: t.Node, parentPath: NodePath) => {
  const startLoc = node.loc ? ` (${node.loc.start.line}:${node.loc.start.column})` : '';

  return getPathOfNode(node, parentPath).buildCodeFrameError(`${error}${startLoc}.`);
};

/**
 * Returns the binding identifier for a member expression.
 * For example the member expression `foo.bar.baz` will return the `foo` identifier.
 *
 * @param expression - Member expression node.
 */
export const getMemberExpressionMeta = (expression: t.MemberExpression) => {
  let bindingIdentifier: t.Identifier | null = null;
  const accessPath: t.Identifier[] = [];

  if (t.isIdentifier(expression.property)) {
    accessPath.push(expression.property);
  }

  traverse(t.expressionStatement(expression), {
    noScope: true,
    MemberExpression(path) {
      if (t.isIdentifier(path.node.object)) {
        bindingIdentifier = path.node.object;
      }

      if (t.isIdentifier(path.node.property)) {
        accessPath.push(path.node.property);
      }
    },
  });

  return {
    bindingIdentifier: bindingIdentifier!,
    accessPath: accessPath.reverse(),
  };
};

/**
 * Will return the value of a path from an object expression.
 *
 * For example if  we take an object expression that looks like:
 * ```
 * { colors: { primary: 'red' } }
 * ```
 *
 * And a path of identifiers that looks like:
 * ```
 * [colors, primary]
 * ```
 *
 * Would result in returning the `red` string literal node.
 * If the value is not found `undefined` will be returned.
 *
 * @param expression - Member expression node.
 * @param accessPath - Access path identifiers.
 */
export const getValueFromObjectExpression = (
  expression: t.ObjectExpression,
  accessPath: t.Identifier[]
): t.Node | undefined => {
  let value: t.Node | undefined = undefined;

  traverse(expression, {
    noScope: true,
    ObjectProperty(path) {
      if (t.isIdentifier(path.node.key, { name: accessPath[0].name })) {
        if (t.isObjectExpression(path.node.value)) {
          value = getValueFromObjectExpression(path.node.value, accessPath.slice(1));
        } else {
          value = path.node.value;
        }

        path.stop();
      }
    },
  });

  return value;
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
export const getKey = (node: t.Expression) => {
  if (t.isIdentifier(node)) {
    return node.name;
  }

  if (t.isStringLiteral(node)) {
    return node.value;
  }

  throw new Error(`${node.type} has no name.'`);
};

/**
 * Returns `true` if an identifier or any paths that reference the identifier are mutated.
 * @param path
 */
const isIdentifierReferencesMutated = (path: NodePath<t.Identifier>): boolean => {
  const binding = path.scope.getBinding(path.node.name);
  if (!binding) {
    return false;
  }

  if (!t.isVariableDeclarator(binding.path.node) || !binding.constant) {
    return true;
  }

  for (let i = 0; i < binding.referencePaths.length; i++) {
    const refPath = binding.referencePaths[i];
    const innerBinding = refPath.scope.getBinding(path.node.name);
    if (!innerBinding) {
      continue;
    }

    if (!t.isVariableDeclarator(innerBinding.path.node) || !innerBinding.constant) {
      return true;
    }
  }

  return false;
};

/**
 * Will traverse a path and its identifiers to find all bindings.
 * If any of those bindings are mutated `true` will be returned.
 *
 * @param path
 */
export const isPathReferencingAnyMutatedIdentifiers = (path: NodePath<any>): boolean => {
  if (path.isIdentifier()) {
    return isIdentifierReferencesMutated(path);
  }

  let mutated = false;
  path.traverse({
    Identifier(innerPath) {
      const result = isIdentifierReferencesMutated(path);
      if (result) {
        mutated = true;
        // No need to keep traversing - let's stop!
        innerPath.stop();
      }
    },
  });

  return mutated;
};

/**
 * Will try to statically evaluate the node.
 * If successful it will return a literal node,
 * else it will return the fallback node.
 *
 * @param node Node to evaluate
 * @param meta
 * @param fallbackNode Optional node to return if evaluation is not successful. Defaults to `node`.
 */
export const tryEvaluateExpression = (
  node: t.Expression,
  meta: Metadata,
  fallbackNode: t.Expression = node
): t.Expression => {
  if (!node) {
    return node;
  }

  const path = getPathOfNode(node, meta.parentPath);
  if (isPathReferencingAnyMutatedIdentifiers(path)) {
    return fallbackNode;
  }

  const result = path.evaluate();
  if (result.value) {
    switch (typeof result.value) {
      case 'string':
        return t.stringLiteral(result.value);

      case 'number':
        return t.numericLiteral(result.value);
    }
  }

  return fallbackNode;
};

interface PartialBindingWithMeta {
  node: t.Node;
  path: NodePath;
  constant: boolean;
  meta: Metadata;
  source: 'import' | 'module';
}

/**
 * Will return the `node` of the a binding.
 * This function will follow import specifiers to return the actual `node`.
 *
 * When wanting to do futher traversal on the resulting `node` make sure to use the output `meta` as well.
 * The `meta` will be for the resulting file it was found in.
 *
 * @param path
 */
export const resolveBindingNode = (
  binding: Binding | undefined,
  meta: Metadata
): PartialBindingWithMeta | undefined => {
  if (!binding || binding.path.isObjectPattern()) {
    // Bail early if there is no binding or its a node that we don't want to resolve
    // such as an destructured args from a function.
    return undefined;
  }

  if (t.isVariableDeclarator(binding.path.node)) {
    return {
      meta,
      node: binding.path.node.init as t.Node,
      path: binding.path,
      constant: binding.constant,
      source: 'module',
    };
  }

  if (binding.path.parentPath.isImportDeclaration()) {
    if (!meta.state.filename) {
      throw new Error('Filename is needed for module traversal.');
    }

    const moduleImportName = binding.path.parentPath.node.source.value;
    const isRelative = moduleImportName.charAt(0) === '.';
    const filename = isRelative
      ? path.join(path.dirname(meta.state.filename), moduleImportName)
      : moduleImportName;
    const modulePath = resolve.sync(filename, {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    });
    const moduleCode = fs.readFileSync(modulePath, 'utf-8');
    const ast = parse(moduleCode, { sourceType: 'module', sourceFilename: modulePath });

    let foundNode: t.Node | undefined = undefined;
    let foundParentPath: NodePath | undefined = undefined;

    if (binding.path.isImportDefaultSpecifier()) {
      traverse(ast, {
        ExportDefaultDeclaration(path) {
          foundParentPath = path as NodePath;
          foundNode = path.node.declaration as t.Node;
        },
      });
    } else if (binding.path.isImportSpecifier()) {
      const exportName = binding.path.node.local.name;

      traverse(ast, {
        ExportNamedDeclaration(path) {
          if (!path.node.declaration || !t.isVariableDeclaration(path.node.declaration)) {
            return;
          }

          for (let i = 0; i < path.node.declaration.declarations.length; i++) {
            const named = path.node.declaration.declarations[i];
            if (t.isIdentifier(named.id) && named.id.name === exportName) {
              foundNode = named.init as t.Node;
              foundParentPath = path as NodePath;
              path.stop();
              break;
            }
          }
        },
      });
    }

    if (!foundNode || !foundParentPath) {
      return undefined;
    }

    return {
      constant: binding.constant,
      node: foundNode,
      path: foundParentPath,
      source: 'import',
      meta: {
        ...meta,
        parentPath: foundParentPath,
        state: {
          ...meta.state,
          file: ast,
          filename,
        },
      },
    };
  }

  return {
    node: binding.path.node as t.Node,
    path: binding.path,
    constant: binding.constant,
    source: 'module',
    meta,
  };
};

/**
 * Will look in an expression and return the actual value.
 * If the expression is an identifier node (a variable) and a constant,
 * it will return the variable reference.
 *
 * E.g: If there was a identifier called `color` that is set somewhere as `const color = 'blue'`,
 * passing the `color` identifier to this function would return `'blue'`.
 *
 * This behaviour is the same for const string & numeric literals,
 * and object expressions.
 *
 * @param expression Expression we want to interrogate.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
export const getInterpolation = (expression: t.Expression, meta: Metadata): t.Expression => {
  let value: t.Node | undefined | null = undefined;

  if (t.isIdentifier(expression)) {
    const binding = meta.parentPath.scope.getBinding(expression.name);
    const resolvedBinding = resolveBindingNode(binding, meta);
    if (binding?.path.node === expression) {
      // We resolved to the same node - bail out!
      return expression;
    }

    if (resolvedBinding && resolvedBinding.constant) {
      // We recursively call get interpolation until it not longer returns an identifier or member expression
      value = getInterpolation(resolvedBinding.node as t.Expression, resolvedBinding.meta);
    }
  } else if (t.isMemberExpression(expression)) {
    const { accessPath, bindingIdentifier } = getMemberExpressionMeta(expression);
    const binding = meta.parentPath.scope.getBinding(bindingIdentifier.name);
    const resolvedBinding = resolveBindingNode(binding, meta);

    if (resolvedBinding && resolvedBinding.constant && t.isObjectExpression(resolvedBinding.node)) {
      const objectValue = getValueFromObjectExpression(
        resolvedBinding.node,
        accessPath
      ) as t.Expression;
      // We recursively call get interpolation until it not longer returns an identifier or member expression
      value = getInterpolation(objectValue, resolvedBinding.meta);
    }
  }

  if (t.isStringLiteral(value) || t.isNumericLiteral(value) || t.isObjectExpression(value)) {
    return value;
  }

  // --------------
  // NOTE: We are recursively calling getInterpolation() which is then going to try and evaluate it
  // multiple times. This may or may not be a performance problem - when looking for quick wins perhaps
  // there is something we could do better here.
  // --------------

  if (value) {
    return tryEvaluateExpression(value as t.Expression, meta, expression);
  }

  return tryEvaluateExpression(expression, meta);
};

/**
 * Will wrap BlockStatement or Expression in an IIFE,
 * Looks like (() => { return 10; })().
 *
 * @param node Node of type either BlockStatement or Expression
 */
export const wrapNodeInIIFE = (node: t.BlockStatement | t.Expression) =>
  t.callExpression(t.arrowFunctionExpression([], node), []);

const tryWrappingBlockStatementInIIFE = (node: t.BlockStatement | t.Expression) =>
  t.isBlockStatement(node) ? wrapNodeInIIFE(node) : node;

/**
 * Will pick `ArrowFunctionExpression` body and tries to wrap it in an IIFE if
 * its a BlockStatement otherwise returns the picked body,
 * E.g.
 * `props => props.color` would end up as `props.color`.
 * `props => { return props.color` } would end up as `(() => { return props.color })()`.
 *
 * @param node Node of type ArrowFunctionExpression
 */
export const pickArrowFunctionExpressionBody = (node: t.ArrowFunctionExpression) =>
  tryWrappingBlockStatementInIIFE(node.body);
