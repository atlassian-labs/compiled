import fs from 'fs';
import { dirname, join } from 'path';

import { parse } from '@babel/parser';
import type { NodePath, Binding } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { DEFAULT_PARSER_BABEL_PLUGINS } from '@compiled/utils';
import resolve from 'resolve';

import { DEFAULT_CODE_EXTENSIONS } from '../constants';
import type { Metadata } from '../types';

import { getDefaultExport, getNamedExport, setImportedCompiledImports } from './traversers';
import type { PartialBindingWithMeta, EvaluateExpression } from './types';

/**
 * Will recursively checks if identifier name is coming from destructuring. If yes,
 * then will return the resolved identifier. We can look for identifier name
 * either in destructuring key or its value.
 *
 * @param name Identifier name to resolve
 * @param node Any Expression node
 * @param resolveFor Either resolve destructuring key or its value
 */
export const resolveIdentifierComingFromDestructuring = ({
  name,
  node,
  resolveFor = 'key',
}: {
  name: string;
  node: t.Expression | undefined;
  resolveFor?: 'key' | 'value';
}): t.ObjectProperty | undefined => {
  let resolvedDestructuringIdentifier: t.ObjectProperty | undefined;

  if (t.isObjectPattern(node)) {
    const pattern = node as t.ObjectPattern;

    return pattern.properties.find((property) => {
      if (t.isObjectProperty(property)) {
        if (resolveFor === 'key') {
          return t.isIdentifier(property.key) && property.key.name === name;
        } else if (resolveFor === 'value') {
          return t.isIdentifier(property.value) && property.value.name === name;
        }
      }

      return false;
    }) as t.ObjectProperty | undefined;
  } else if (t.isVariableDeclarator(node)) {
    const declarator = node as t.VariableDeclarator;

    resolvedDestructuringIdentifier = resolveIdentifierComingFromDestructuring({
      name,
      node: declarator.id as t.Expression,
      resolveFor,
    });
  }

  return resolvedDestructuringIdentifier;
};

/**
 * Will resolve the value `node` for identifier present inside destructuring
 * If value `node` resolves to an identifier, it will recursively search for its
 * value `node`.
 *
 * For eg.
 * 1. If there is an identifier `foo`, coming from destructuring `{ bar: foo }`
 * having value node as `{ bar: 10 }`, it will resolve to `NumericalLiteral` node `10`.
 * 2. If there is an identifier `foo`, coming from destructuring `{ baz: foo }`
 * referencing an identifier `bar` which in turn having value node as `{ baz: 10 }`,
 * it will search recursively and resolve to `NumericalLiteral` node `10`.
 *
 * @param expression Node inside which we have to resolve the value
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 * @param referenceName {string} Reference name for which `binding` to be resolved
 */
const resolveObjectPatternValueNode = (
  expression: t.Expression,
  meta: Metadata,
  referenceName: string,
  evaluateExpression: EvaluateExpression
): t.Node | undefined => {
  let objectPatternValueNode: t.Node | undefined = undefined;

  if (t.isObjectExpression(expression)) {
    traverse(expression, {
      noScope: true,
      ObjectProperty: {
        exit(path) {
          if (t.isIdentifier(path.node.key, { name: referenceName })) {
            objectPatternValueNode = path.node.value;

            path.stop();
          }
        },
      },
    });
  } else if (t.isMemberExpression(expression) && t.isMemberExpression(expression.object)) {
    const { value: node, meta: updatedMeta } = evaluateExpression(expression, meta);

    objectPatternValueNode = resolveObjectPatternValueNode(
      node,
      updatedMeta,
      referenceName,
      evaluateExpression
    );
  } else if (
    t.isIdentifier(expression) ||
    (t.isMemberExpression(expression) && t.isIdentifier(expression.object))
  ) {
    const name = t.isIdentifier(expression)
      ? expression.name
      : (expression.object as t.Identifier).name;

    const resolvedBinding = resolveBinding(name, meta, evaluateExpression);

    if (resolvedBinding) {
      const isResolvedToSameNode = resolvedBinding.path.node === expression;

      if (
        !isResolvedToSameNode &&
        resolvedBinding.constant &&
        t.isExpression(resolvedBinding.node)
      ) {
        objectPatternValueNode = resolveObjectPatternValueNode(
          resolvedBinding.node,
          meta,
          referenceName,
          evaluateExpression
        );
      }
    }
  }

  return objectPatternValueNode;
};

/**
 * Will return property key if it is different from its value and its value is
 * equal to reference name for which we have to resolve binding.
 *
 * Eg. If we have something like `const { key: value } = { key: 'something' }`, and
 * reference name is `value`, it will return `key` so that it can be resolved to
 * 'something' otherwise it won't get resolved.
 * Input: `node: const { key: value } = { key: 'something' }, referenceName: 'value'`
 * Output: `'key'`
 *
 * Input: `node: const { key } = { key: 'something' }, referenceName: 'value'`
 * Output: `'value'`
 *
 * Input: `node: const { key } = { key: 'something' }, referenceName: 'key'`
 * Output: `'key'`

 * @param node Object pattern node which we have to investigate
 * @param referenceName Reference name for which `binding` to be resolved
 */
const getDestructuredObjectPatternKey = (node: t.ObjectPattern, referenceName: string): string => {
  let result = referenceName;

  for (const property of node.properties) {
    if (t.isObjectProperty(property)) {
      const keyName = t.isIdentifier(property.key) ? property.key.name : '';
      const keyValue = t.isIdentifier(property.value) ? property.value.name : '';

      if (keyName !== keyValue && keyValue === referenceName) {
        result = keyName;

        break;
      }
    }
  }

  return result;
};

const resolveRequest = (request: string, extensions: string[], meta: Metadata) => {
  const { filename, resolver } = meta.state;
  if (!filename) {
    throw new Error('Unable to resolve request due to a missing filename, this is probably a bug!');
  }

  if (!resolver) {
    const id = request.charAt(0) === '.' ? join(dirname(filename), request) : request;

    return resolve.sync(id, {
      extensions,
    });
  }

  return resolver.resolveSync(filename, request);
};

const getBinding = (referenceName: string, meta: Metadata): Binding | undefined => {
  const { ownPath, parentPath } = meta;
  // Check binding in own scope first so that manually created scopes can be
  // evaluated first then parent scopes or scopes coming from different module.
  const scopedBinding =
    ownPath?.scope.getOwnBinding(referenceName) || parentPath.scope.getBinding(referenceName);

  if (scopedBinding) {
    return scopedBinding;
  }

  // Is re-exported directly from another module i.e. `export { foo } from 'bar'`
  if (parentPath.isExportNamedDeclaration() && parentPath.node.source) {
    return {
      identifier: t.identifier(referenceName),
      scope: parentPath.scope,
      path: parentPath,
      kind: 'const',
      referenced: false,
      references: 0,
      referencePaths: [],
      constant: true,
      constantViolations: [],
    } as Binding;
  }

  return undefined;
};

const getModuleImportSource = (path: Binding['path']): string => {
  if (path.parentPath?.isImportDeclaration()) {
    return path.parentPath.node.source.value;
  }

  if (path.isExportNamedDeclaration()) {
    return path.node.source?.value || '';
  }

  return '';
};

/**
 * Will return the `node` of the a binding.
 * This function will follow import specifiers to return the actual `node`.
 *
 * When wanting to do further traversal on the resulting `node` make sure to use the output `meta` as well.
 * The `meta` will be for the resulting file it was found in.
 *
 * @param referenceName {string} Reference name for which `binding` to be resolved
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const resolveBinding = (
  referenceName: string,
  meta: Metadata,
  evaluateExpression: EvaluateExpression
): PartialBindingWithMeta | undefined => {
  const binding = getBinding(referenceName, meta);

  if (!binding || binding.path.isObjectPattern()) {
    // Bail early if there is no binding or its a node that we don't want to resolve
    // such as an destructured args from a function.
    return undefined;
  }

  if (t.isVariableDeclarator(binding.path.node)) {
    let node = binding.path.node.init as t.Node;

    if (t.isObjectPattern(binding.path.node.id) && t.isExpression(node)) {
      node = resolveObjectPatternValueNode(
        node,
        meta,
        getDestructuredObjectPatternKey(binding.path.node.id, referenceName),
        evaluateExpression
      ) as t.Node;
    }

    return {
      meta,
      node,
      path: binding.path,
      constant: binding.constant,
      source: 'module',
    };
  }

  if (binding.path.parentPath?.isImportDeclaration() || binding.path.isExportNamedDeclaration()) {
    // NOTE: We're skipping traversal when file name is not resolved. Imported identifier
    // will end up as a dynamic variable instead.
    if (!meta.state.filename) {
      return;
    }

    const moduleImportSource = getModuleImportSource(binding.path);

    // Babel Plugin cannot differentiate between a variable and reserved keywords (e.g keyframes)
    // It will therefore try to parse and resolve both.
    // This workaround short circuits when we call `resolveBinding` on a Compiled module.
    // Documented in Issue ##1010: https://github.com/atlassian-labs/compiled/issues/1010
    if (moduleImportSource.startsWith('@compiled/')) {
      // Ignore @compiled modules.
      return;
    }

    const extensions = meta.state.opts.extensions ?? DEFAULT_CODE_EXTENSIONS;
    const modulePath = resolveRequest(moduleImportSource, extensions, meta);

    if (!extensions.some((extension) => modulePath.endsWith(extension))) {
      // Don't attempt to parse any files that are not configured as code
      return;
    }

    const moduleCode = meta.state.cache.load({
      namespace: 'read-file',
      cacheKey: modulePath,
      value: () => fs.readFileSync(modulePath, 'utf-8'),
    });

    const ast = meta.state.cache.load({
      namespace: 'parse-module',
      cacheKey: modulePath,
      value: () =>
        parse(moduleCode, {
          sourceType: 'module',
          sourceFilename: modulePath,
          plugins: meta.state.opts.parserBabelPlugins ?? DEFAULT_PARSER_BABEL_PLUGINS,
        }),
    });

    let foundNode: t.Node | undefined = undefined;
    let foundParentPath: NodePath | undefined = undefined;

    if (binding.path.isImportDefaultSpecifier()) {
      ({ foundNode, foundParentPath } = meta.state.cache.load({
        namespace: 'find-default-export-module-node',
        cacheKey: modulePath,
        value: () => {
          const result = getDefaultExport(ast);

          return {
            foundNode: result?.node,
            foundParentPath: result?.path,
          };
        },
      }));
    } else if (binding.path.isImportSpecifier()) {
      const { imported } = binding.path.node;
      const exportName = t.isIdentifier(imported) ? imported.name : imported.value;

      ({ foundNode, foundParentPath } = meta.state.cache.load({
        namespace: 'find-named-export-module-node',
        cacheKey: `modulePath=${modulePath}&exportName=${exportName}`,
        value: () => {
          const result = getNamedExport(ast, exportName);

          // Check for imported mixins
          setImportedCompiledImports(ast, meta.state);

          return {
            foundNode: result?.node,
            foundParentPath: result?.path,
          };
        },
      }));
    } else if (binding.path.isImportNamespaceSpecifier()) {
      // There's no node inside the file to reference for namespace imports
      // i.e. import * as theme from 'theme';
      // Therefore we just return the binding path
      const { path } = binding;

      foundNode = path.node;
      foundParentPath = path.parentPath;
    } else if (binding.path.isExportNamedDeclaration()) {
      // Find the export specifier NodePath so we can check aliases
      const exportedSpecifier = binding.path.get('specifiers').find(({ node }) => {
        return t.isIdentifier(node.exported, { name: referenceName });
      });
      // Get the non alias name of the export
      const exportName =
        exportedSpecifier && t.isExportSpecifier(exportedSpecifier.node)
          ? exportedSpecifier.node.local.name
          : referenceName;
      const isDefaultExport = exportName === 'default';

      ({ foundNode, foundParentPath } = meta.state.cache.load({
        namespace: isDefaultExport
          ? 'find-default-export-module-node'
          : 'find-named-export-module-node',
        cacheKey: isDefaultExport
          ? modulePath
          : `modulePath=${modulePath}&exportName=${exportName}`,
        value: () => {
          const result = isDefaultExport ? getDefaultExport(ast) : getNamedExport(ast, exportName);

          return {
            foundNode: result?.node,
            foundParentPath: result?.path,
          };
        },
      }));
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
          filename: modulePath,
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
