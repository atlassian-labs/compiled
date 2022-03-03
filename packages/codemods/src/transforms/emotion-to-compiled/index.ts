import type {
  API,
  Collection,
  CommentBlock,
  CommentLine,
  FileInfo,
  ObjectPattern,
  Options,
  Program,
} from 'jscodeshift';
import type core from 'jscodeshift';

import { COMPILED_IMPORT_PATH } from '../../constants';
import defaultCodemodPlugin from '../../plugins/default';
import type { CodemodPluginInstance } from '../../plugins/types';
import {
  addCommentBefore,
  addCommentForUnresolvedImportSpecifiers,
  applyVisitor,
  convertDefaultImportToNamedImport,
  convertMixedImportToNamedImport,
  getImportDeclarationCollection,
  hasImportDeclaration,
  withPlugin,
} from '../../utils';

import { addReactIdentifier, findImportSpecifierName, mergeImportSpecifiers } from './utils';

const imports = {
  compiledStyledImportName: 'styled',
  emotionCorePackageName: '@emotion/core',
  emotionCoreReactImportNames: {
    ClassNames: 'ClassNames',
    css: 'css',
    jsx: 'jsx',
    keyframes: 'keyframes',
  },
  emotionJSXPragma: '@jsx jsx',
  emotionReactPackageName: '@emotion/react',
  emotionStyledPackageName: '@emotion/styled',
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

      addReactIdentifier({ collection, j });
    });
  });
};

const replaceEmotionCoreCSSTaggedTemplateExpression = (
  j: core.JSCodeshift,
  collection: Collection,
  importPath: string
) => {
  const importDeclarationCollection = getImportDeclarationCollection({
    collection,
    importPath,
    j,
  });
  const name = findImportSpecifierName({
    importDeclarationCollection,
    importName: imports.emotionCoreReactImportNames.css,
    j,
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
  const compiledRuntimePackageName = `${COMPILED_IMPORT_PATH}/runtime`;

  const cxObjectPropertyCollection = j(objectPattern)
    .find(j.ObjectProperty)
    .filter(
      (objectPropertyPath) =>
        objectPropertyPath.node.key.type === 'Identifier' &&
        objectPropertyPath.node.key.name === cxIdentifierName
    );

  cxObjectPropertyCollection.forEach((cxObjectPropertyPath) => {
    addCommentBefore({
      collection: j(cxObjectPropertyPath.node),
      j,
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
      collection: j(styleObjectProperty),
      j,
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
    collection,
    importPath,
    j,
  });
  const name = findImportSpecifierName({
    importDeclarationCollection,
    importName: imports.emotionCoreReactImportNames.ClassNames,
    j,
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

const mergeCompiledImportSpecifiers = (j: core.JSCodeshift, collection: Collection) => {
  const allowedCompiledNames = [
    imports.compiledStyledImportName,
    ...Object.values(imports.emotionCoreReactImportNames),
  ].filter((name) => ![imports.emotionCoreReactImportNames.jsx].includes(name));

  mergeImportSpecifiers({
    collection,
    filter: (name) => !!(name && allowedCompiledNames.includes(name)),
    j,
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
    collection,
    importPath: imports.emotionCorePackageName,
    j,
  });

  const hasEmotionReactImportDeclaration = hasImportDeclaration({
    collection,
    importPath: imports.emotionReactPackageName,
    j,
  });

  const hasEmotionStyledImportDeclaration = hasImportDeclaration({
    collection,
    importPath: imports.emotionStyledPackageName,
    j,
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
      collection,
      importPath: imports.emotionStyledPackageName,
      j,
      namedImport: imports.compiledStyledImportName,
      plugins,
    });
  }

  if (hasEmotionCoreImportDeclaration || hasEmotionReactImportDeclaration) {
    removeEmotionJSXPragma(j, collection);
  }

  if (hasEmotionCoreImportDeclaration) {
    addCommentForUnresolvedImportSpecifiers({
      allowedImportSpecifierNames: Object.values(imports.emotionCoreReactImportNames),
      collection,
      importPath: imports.emotionCorePackageName,
      j,
    });
    replaceEmotionCoreCSSTaggedTemplateExpression(j, collection, imports.emotionCorePackageName);
    handleClassNamesBehavior(j, collection, imports.emotionCorePackageName);
    convertMixedImportToNamedImport({
      allowedImportSpecifierNames: Object.values(imports.emotionCoreReactImportNames),
      collection,
      defaultSourceSpecifierName: imports.compiledStyledImportName,
      importPath: imports.emotionCorePackageName,
      j,
      plugins,
    });
  }

  if (hasEmotionReactImportDeclaration) {
    addCommentForUnresolvedImportSpecifiers({
      allowedImportSpecifierNames: Object.values(imports.emotionCoreReactImportNames),
      collection,
      importPath: imports.emotionReactPackageName,
      j,
    });
    replaceEmotionCoreCSSTaggedTemplateExpression(j, collection, imports.emotionReactPackageName);
    handleClassNamesBehavior(j, collection, imports.emotionReactPackageName);
    convertMixedImportToNamedImport({
      allowedImportSpecifierNames: Object.values(imports.emotionCoreReactImportNames),
      collection,
      defaultSourceSpecifierName: imports.compiledStyledImportName,
      importPath: imports.emotionReactPackageName,
      j,
      plugins,
    });
  }

  mergeCompiledImportSpecifiers(j, collection);

  applyVisitor({
    currentProgram: collection.find(j.Program).get(),
    originalProgram,
    plugins,
  });

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default withPlugin(transformer);
