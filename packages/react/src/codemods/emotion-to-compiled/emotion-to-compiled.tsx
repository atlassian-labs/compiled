import core, { FileInfo, API, Options, Collection, ASTPath, CommentBlock } from 'jscodeshift';

import {
  hasImportDeclaration,
  getImportDeclarationCollection,
  findImportSpecifierName,
  addCommentForUnresolvedImportSpecifiers,
  addReactIdentifier,
  convertDefaultImportToNamedImport,
  replaceImportDeclaration,
  mergeImportSpecifiersAlongWithTheirComments,
} from '../codemods-helpers';

const imports = {
  compiledStyledImportName: 'styled',
  emotionStyledPackageName: '@emotion/styled',
  emotionCoreJSXPragma: '@jsx jsx',
  emotionCoreImportNames: { jsx: 'jsx', css: 'css', ClassNames: 'ClassNames' },
  emotionCorePackageName: '@emotion/core',
};

const removeEmotionCoreJSXPragma = (j: core.JSCodeshift, collection: Collection) => {
  const commentCollection = collection.find(j.Comment);

  commentCollection.forEach((commentPath) => {
    const commentBlockCollection = j(
      (commentPath as unknown) as ASTPath<CommentBlock>
    ).filter((commentBlockPath) =>
      commentBlockPath.value.value.includes(imports.emotionCoreJSXPragma)
    );

    commentBlockCollection.forEach((commentBlockPath) => {
      j(commentBlockPath).remove();

      addReactIdentifier({ j, collection });
    });
  });
};

const replaceEmotionCoreCSSTaggedTemplateExpression = (
  j: core.JSCodeshift,
  collection: Collection
) => {
  const importDeclarationCollection = getImportDeclarationCollection({
    j,
    collection,
    importPath: imports.emotionCorePackageName,
  });
  const name = findImportSpecifierName({
    j,
    importDeclarationCollection,
    importName: imports.emotionCoreImportNames.css,
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

const mergeCompiledImportSpecifiers = (j: core.JSCodeshift, collection: Collection) => {
  const allowedCompiledNames = [
    imports.compiledStyledImportName,
    ...Object.values(imports.emotionCoreImportNames),
  ].filter(
    (name) =>
      ![imports.emotionCoreImportNames.jsx, imports.emotionCoreImportNames.css].includes(name)
  );

  mergeImportSpecifiersAlongWithTheirComments({
    j,
    collection,
    filter: (name) => !!(name && allowedCompiledNames.includes(name)),
  });
};

const transformer = (fileInfo: FileInfo, { jscodeshift: j }: API, options: Options) => {
  const { source } = fileInfo;
  const collection = j(source);

  const hasEmotionCoreImportDeclaration = hasImportDeclaration({
    j,
    collection,
    importPath: imports.emotionCorePackageName,
  });
  const hasEmotionStyledImportDeclaration = hasImportDeclaration({
    j,
    collection,
    importPath: imports.emotionStyledPackageName,
  });

  if (!hasEmotionCoreImportDeclaration && !hasEmotionStyledImportDeclaration) {
    return source;
  }

  if (hasEmotionStyledImportDeclaration) {
    convertDefaultImportToNamedImport({
      j,
      collection,
      importPath: imports.emotionStyledPackageName,
      namedImport: imports.compiledStyledImportName,
    });
  }

  if (hasEmotionCoreImportDeclaration) {
    removeEmotionCoreJSXPragma(j, collection);
    addCommentForUnresolvedImportSpecifiers({
      j,
      collection,
      importPath: imports.emotionCorePackageName,
      allowedImportSpecifierNames: Object.values(imports.emotionCoreImportNames),
    });
    replaceEmotionCoreCSSTaggedTemplateExpression(j, collection);
    replaceImportDeclaration({ j, collection, importPath: imports.emotionCorePackageName });
  }

  mergeCompiledImportSpecifiers(j, collection);

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default transformer;
