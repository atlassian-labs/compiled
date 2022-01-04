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
  addReactIdentifier,
  applyVisitor,
  convertDefaultImportToNamedImport,
  convertMixedImportToNamedImport,
  findImportSpecifierName,
  getImportDeclarationCollection,
  hasImportDeclaration,
  mergeImportSpecifiersAlongWithTheirComments,
  withPlugin,
} from '../../utils/main';

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

const mergeCompiledImportSpecifiers = (j: core.JSCodeshift, collection: Collection) => {
  const allowedCompiledNames = [
    imports.compiledStyledImportName,
    ...Object.values(imports.emotionCoreReactImportNames),
  ].filter((name) => ![imports.emotionCoreReactImportNames.jsx].includes(name));

  mergeImportSpecifiersAlongWithTheirComments({
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
    addCommentForUnresolvedImportSpecifiers({
      j,
      collection,
      importPath: imports.emotionCorePackageName,
      allowedImportSpecifierNames: Object.values(imports.emotionCoreReactImportNames),
    });
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
    addCommentForUnresolvedImportSpecifiers({
      j,
      collection,
      importPath: imports.emotionReactPackageName,
      allowedImportSpecifierNames: Object.values(imports.emotionCoreReactImportNames),
    });
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
