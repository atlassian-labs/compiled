import { COMPILED_IMPORT } from '@compiled/utils';
import type {
  API,
  ASTPath,
  Collection,
  CommentBlock,
  CommentLine,
  FileInfo,
  ImportDeclaration,
  ImportSpecifier,
  ObjectPattern,
  Options,
  Program,
} from 'jscodeshift';
import type core from 'jscodeshift';

import defaultCodemodPlugin from '../../plugins/default';
import type { CodemodPluginInstance } from '../../plugins/types';
import {
  addCommentBefore,
  applyVisitor,
  convertDefaultImportToNamedImport,
  convertMixedImportToNamedImport,
  getImportDeclarationCollection,
  hasImportDeclaration,
  withPlugin,
} from '../../utils';

import { addReactIdentifier, findImportSpecifierName, mergeImportSpecifiers } from './utils';

/**
 * Type-only imports from `@emotion/core` / `@emotion/react` that Compiled does
 * not provide an equivalent for. The codemod replaces their usages with `any`
 * and leaves a TODO so the developer can manually pick a Compiled-friendly
 * replacement instead of being stuck with a half-migrated file that still
 * pulls in `@emotion/*`.
 */
const emotionUnsupportedTypeNames = ['Interpolation', 'CSSProperties'];

const imports = {
  compiledStyledImportName: 'styled',
  emotionStyledPackageName: '@emotion/styled',
  emotionJSXPragma: '@jsx jsx',
  emotionCoreReactImportNames: {
    jsx: 'jsx',
    css: 'css',
    ClassNames: 'ClassNames',
    keyframes: 'keyframes',
  },
  emotionCorePackageName: '@emotion/core',
  emotionReactPackageName: '@emotion/react',
};

const removeEmotionJSXPragma = (j: core.JSCodeshift, collection: Collection) => {
  // ast-types are incorrect and can't handle both line and block types
  // Cast to the correct type so we get safety
  const commentCollection: Collection<CommentLine | CommentBlock> = collection.find(
    j.Comment as any
  );

  commentCollection.forEach((commentPath) => {
    const commentBlockCollection = j(commentPath).filter((commentBlockPath) =>
      commentBlockPath.value.value.includes(imports.emotionJSXPragma)
    );

    commentBlockCollection.forEach((commentBlockPath) => {
      j(commentBlockPath).remove();

      addReactIdentifier({ j, collection });
    });
  });
};

const replaceEmotionCoreCSSTaggedTemplateExpression = (
  j: core.JSCodeshift,
  collection: Collection,
  importPath: string
) => {
  const importDeclarationCollection = getImportDeclarationCollection({
    j,
    collection,
    importPath,
  });
  const name = findImportSpecifierName({
    j,
    importDeclarationCollection,
    importName: imports.emotionCoreReactImportNames.css,
  });

  if (name == null) {
    return;
  }

  collection
    .find(j.TaggedTemplateExpression)
    .filter((taggedTemplateExpressionPath) =>
      j(taggedTemplateExpressionPath)
        .find(j.Identifier)
        .some((identifierPath) => identifierPath.node.name === name)
    )
    .forEach((taggedTemplateExpressionPath) => {
      const { quasi } = taggedTemplateExpressionPath.node;

      if (quasi) {
        j(taggedTemplateExpressionPath).replaceWith([quasi]);
      }
    });
};

const handleClassNamesCXBehavior = (j: core.JSCodeshift, objectPattern: ObjectPattern) => {
  const cxIdentifierName = 'cx';
  const axIdentifierName = 'ax';
  const compiledRuntimePackageName = `${COMPILED_IMPORT}/runtime`;

  const cxObjectPropertyCollection = j(objectPattern)
    .find(j.ObjectProperty)
    .filter(
      (objectPropertyPath) =>
        objectPropertyPath.node.key.type === 'Identifier' &&
        objectPropertyPath.node.key.name === cxIdentifierName
    );

  cxObjectPropertyCollection.forEach((cxObjectPropertyPath) => {
    addCommentBefore({
      j,
      collection: j(cxObjectPropertyPath.node),
      message: `Please replace "${cxIdentifierName}" with "${axIdentifierName}" from "${compiledRuntimePackageName}".
      Usage: import { ${axIdentifierName} } from '${compiledRuntimePackageName}';

      NOTE: Both "${cxIdentifierName}" and "${axIdentifierName}" have some differences, so we have not replaced its usage.
      Please check the docs for "${axIdentifierName}" usage.

      In future, we will expose "${axIdentifierName}" directly from "${imports.emotionCoreReactImportNames.ClassNames}" props.

      Issue tracked on Github: https://github.com/atlassian-labs/compiled/issues/373`,
    });
  });
};

const handleClassNamesStyleBehavior = (j: core.JSCodeshift, objectPattern: ObjectPattern) => {
  const styleIdentifierName = 'style';

  const hasStyleObjectProperty = j(objectPattern)
    .find(j.ObjectProperty)
    .some(
      (objectPropertyPath) =>
        objectPropertyPath.node.key.type === 'Identifier' &&
        objectPropertyPath.node.key.name === styleIdentifierName
    );

  if (!hasStyleObjectProperty) {
    const styleObjectProperty = j.objectProperty(
      j.identifier(styleIdentifierName),
      j.identifier(styleIdentifierName)
    );

    objectPattern.properties.push(styleObjectProperty);

    addCommentBefore({
      j,
      collection: j(styleObjectProperty),
      message: `We have exported "${styleIdentifierName}" from "${imports.emotionCoreReactImportNames.ClassNames}" props.
      If you are using dynamic declarations, make sure to set the "${styleIdentifierName}"
      prop otherwise remove it.`,
    });
  }
};

const handleClassNamesBehavior = (
  j: core.JSCodeshift,
  collection: Collection,
  importPath: string
) => {
  const importDeclarationCollection = getImportDeclarationCollection({
    j,
    collection,
    importPath,
  });
  const name = findImportSpecifierName({
    j,
    importDeclarationCollection,
    importName: imports.emotionCoreReactImportNames.ClassNames,
  });

  if (name == null) {
    return;
  }

  collection
    .find(j.JSXElement)
    .filter((jsxElementPath) =>
      j(jsxElementPath)
        .find(j.JSXIdentifier)
        .some((jsxIdentifierPath) => jsxIdentifierPath.node.name === name)
    )
    .find(j.JSXExpressionContainer)
    .forEach((jsxExpressionContainer) => {
      const { expression } = jsxExpressionContainer.node;

      if (
        expression.type === 'FunctionExpression' ||
        expression.type === 'ArrowFunctionExpression'
      ) {
        if (expression.params.length && expression.params[0].type === 'ObjectPattern') {
          const objectPattern = expression.params[0];

          handleClassNamesStyleBehavior(j, objectPattern);

          handleClassNamesCXBehavior(j, objectPattern);
        }
      }
    });
};

/**
 * Returns true if the given type reference is shadowed by a local TS type
 * declaration in an enclosing function/block/module scope. Used to avoid
 * rewriting a local `type Interpolation = string` just because the file also
 * happens to import `Interpolation` from `@emotion/*`.
 */
const isTypeNameShadowedInScope = (
  j: core.JSCodeshift,
  refPath: ASTPath<any>,
  typeName: string
): boolean => {
  let cursor: ASTPath<any> | null = refPath.parent;
  while (cursor) {
    const node = cursor.node;
    // Pull the statement list of any lexical scope we recognise.
    let body: unknown = null;
    if (j.BlockStatement.check(node)) {
      body = node.body;
    } else if (
      (j.FunctionDeclaration.check(node) ||
        j.FunctionExpression.check(node) ||
        j.ArrowFunctionExpression.check(node)) &&
      j.BlockStatement.check(node.body)
    ) {
      body = node.body.body;
    } else if (j.TSModuleDeclaration.check(node) && j.TSModuleBlock.check(node.body)) {
      body = node.body.body;
    }

    if (Array.isArray(body)) {
      for (const stmt of body) {
        if (
          (j.TSTypeAliasDeclaration.check(stmt) || j.TSInterfaceDeclaration.check(stmt)) &&
          stmt.id &&
          stmt.id.type === 'Identifier' &&
          stmt.id.name === typeName
        ) {
          return true;
        }
      }
    }

    cursor = cursor.parent;
  }
  return false;
};

const replaceUnsupportedEmotionTypes = (
  j: core.JSCodeshift,
  collection: Collection,
  importPath: string
) => {
  const importDeclarationCollection = getImportDeclarationCollection({
    j,
    collection,
    importPath,
  });

  if (importDeclarationCollection.length === 0) {
    return;
  }

  emotionUnsupportedTypeNames.forEach((emotionTypeName) => {
    // Collect every import specifier for this unsupported emotion type. Users
    // can legitimately import the same name in multiple declarations with
    // different local aliases, e.g.
    //
    //   import { Interpolation } from '@emotion/core';
    //   import { Interpolation as Int } from '@emotion/core';
    //
    // Both aliases need their references replaced, and only the matching
    // specifiers should be removed afterwards.
    const matchingSpecifiers: { path: ASTPath<ImportSpecifier>; localName: string }[] = [];
    importDeclarationCollection.find(j.ImportSpecifier).forEach((specPath) => {
      const spec = specPath.node;
      if (
        spec.imported.type === 'Identifier' &&
        spec.imported.name === emotionTypeName &&
        spec.local
      ) {
        matchingSpecifiers.push({ path: specPath, localName: spec.local.name });
      }
    });

    if (matchingSpecifiers.length === 0) {
      return;
    }

    matchingSpecifiers.forEach(({ localName }) => {
      collection
        .find(j.TSTypeReference)
        .filter((path) => {
          const typeName = path.node.typeName;
          if (typeName.type !== 'Identifier' || typeName.name !== localName) {
            return false;
          }
          // Don't rewrite references that resolve to a local `type` or
          // `interface` with the same name — those aren't the emotion import.
          return !isTypeNameShadowedInScope(j, path, localName);
        })
        .forEach((path) => {
          // Attach the TODO to the closest enclosing statement so it lands above
          // the code that owns the type — not above some intermediate type node
          // that has no comment slot of its own.
          let stmtPath: ASTPath<any> = path;
          while (stmtPath.parent && !j.Statement.check(stmtPath.parent.node)) {
            stmtPath = stmtPath.parent;
          }
          if (stmtPath.parent) {
            addCommentBefore({
              j,
              collection: j(stmtPath.parent.node) as Collection<Program>,
              message: `Compiled does not provide an equivalent for "${emotionTypeName}" from "${importPath}". This type has been replaced with \`any\` — replace it with a Compiled-compatible alternative when migrating.`,
            });
          }
          j(path).replaceWith(j.tsAnyKeyword());
        });
    });

    // Drop only the specifiers we just rewrote — leave any other specifiers
    // on the same declaration untouched. (`convertMixedImportToNamedImport`
    // runs after this and handles re-homing the supported ones.)
    matchingSpecifiers.forEach(({ path }) => {
      j(path).remove();
    });
  });

  // If the emotion declaration is now empty, remove it entirely.
  importDeclarationCollection.forEach((importDeclPath: ASTPath<ImportDeclaration>) => {
    if (!importDeclPath.node.specifiers || importDeclPath.node.specifiers.length === 0) {
      j(importDeclPath).remove();
    }
  });
};

const mergeCompiledImportSpecifiers = (j: core.JSCodeshift, collection: Collection) => {
  const allowedCompiledNames = [
    imports.compiledStyledImportName,
    ...Object.values(imports.emotionCoreReactImportNames),
  ].filter((name) => ![imports.emotionCoreReactImportNames.jsx].includes(name));

  mergeImportSpecifiers({
    j,
    collection,
    filter: (name) => !!(name && allowedCompiledNames.includes(name)),
  });
};

const transformer = (fileInfo: FileInfo, api: API, options: Options): string => {
  const { source } = fileInfo;
  const { jscodeshift: j } = api;
  const collection = j(source);
  // Run default plugin first and apply plugins in order
  const plugins: CodemodPluginInstance[] = [defaultCodemodPlugin, ...options.normalizedPlugins].map(
    (plugin) => plugin.create(fileInfo, api, options)
  );
  const originalProgram: Program = j(source).find(j.Program).get();

  const hasEmotionCoreImportDeclaration = hasImportDeclaration({
    j,
    collection,
    importPath: imports.emotionCorePackageName,
  });

  const hasEmotionReactImportDeclaration = hasImportDeclaration({
    j,
    collection,
    importPath: imports.emotionReactPackageName,
  });

  const hasEmotionStyledImportDeclaration = hasImportDeclaration({
    j,
    collection,
    importPath: imports.emotionStyledPackageName,
  });

  if (
    !hasEmotionCoreImportDeclaration &&
    !hasEmotionStyledImportDeclaration &&
    !hasEmotionReactImportDeclaration
  ) {
    return source;
  }

  if (hasEmotionStyledImportDeclaration) {
    convertDefaultImportToNamedImport({
      j,
      plugins,
      collection,
      importPath: imports.emotionStyledPackageName,
      namedImport: imports.compiledStyledImportName,
    });
  }

  if (hasEmotionCoreImportDeclaration || hasEmotionReactImportDeclaration) {
    removeEmotionJSXPragma(j, collection);
  }

  if (hasEmotionCoreImportDeclaration) {
    replaceUnsupportedEmotionTypes(j, collection, imports.emotionCorePackageName);
    replaceEmotionCoreCSSTaggedTemplateExpression(j, collection, imports.emotionCorePackageName);
    handleClassNamesBehavior(j, collection, imports.emotionCorePackageName);
    convertMixedImportToNamedImport({
      j,
      plugins,
      collection,
      importPath: imports.emotionCorePackageName,
      defaultSourceSpecifierName: imports.compiledStyledImportName,
      allowedImportSpecifierNames: Object.values(imports.emotionCoreReactImportNames),
    });
  }

  if (hasEmotionReactImportDeclaration) {
    replaceUnsupportedEmotionTypes(j, collection, imports.emotionReactPackageName);
    replaceEmotionCoreCSSTaggedTemplateExpression(j, collection, imports.emotionReactPackageName);
    handleClassNamesBehavior(j, collection, imports.emotionReactPackageName);
    convertMixedImportToNamedImport({
      j,
      plugins,
      collection,
      importPath: imports.emotionReactPackageName,
      defaultSourceSpecifierName: imports.compiledStyledImportName,
      allowedImportSpecifierNames: Object.values(imports.emotionCoreReactImportNames),
    });
  }

  mergeCompiledImportSpecifiers(j, collection);

  applyVisitor({
    plugins,
    originalProgram,
    currentProgram: collection.find(j.Program).get(),
  });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);
