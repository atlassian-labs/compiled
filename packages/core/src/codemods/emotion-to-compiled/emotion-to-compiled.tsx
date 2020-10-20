import core, { FileInfo, API, Options, Collection, ASTPath, CommentBlock } from 'jscodeshift';

import {
  hasImportDeclaration,
  getImportDeclarationCollection,
  findImportSpecifierName,
  buildDefaultImportDeclaration,
} from '../codemods-helpers';

const imports = {
  compiledPackageName: '@compiled/core',
  compiledImportName: 'styled',
  emotionStyledPackageName: '@emotion/styled',
  emotionCoreJSXPragma: '@jsx jsx',
  emotionCoreImportNames: { jsx: 'jsx', css: 'css' },
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

const removeEmotionCoreImportDeclaration = (j: core.JSCodeshift, collection: Collection) => {
  const importDeclarationCollection = getImportDeclarationCollection({
    j,
    collection,
    importPath: imports.emotionCorePackageName,
  });

  importDeclarationCollection.forEach((importDeclarationPath) => {
    j(importDeclarationPath).remove();
  });
};

const buildCompiledImportDeclaration = (j: core.JSCodeshift, collection: Collection) => {
  const importDeclarationCollection = getImportDeclarationCollection({
    j,
    collection,
    importPath: imports.emotionCorePackageName,
  });

  importDeclarationCollection.forEach((importDeclarationPath) => {
    j(importDeclarationPath).replaceWith([
      j.importDeclaration([], j.literal(imports.compiledPackageName)),
    ]);
  });
};

const transformer = (fileInfo: FileInfo, { jscodeshift: j }: API, options: Options) => {
  const { source } = fileInfo;
  const collection = j(source);

  const hasEmotionStyledImportDeclaration = hasImportDeclaration({
    j,
    collection,
    importPath: imports.emotionStyledPackageName,
  });
  const hasEmotionCoreImportDeclaration = hasImportDeclaration({
    j,
    collection,
    importPath: imports.emotionCorePackageName,
  });

  if (!hasEmotionStyledImportDeclaration && !hasEmotionCoreImportDeclaration) {
    return source;
  }

  if (hasEmotionStyledImportDeclaration) {
    buildDefaultImportDeclaration({
      j,
      collection,
      importPathFrom: imports.emotionStyledPackageName,
      importPathTo: imports.compiledPackageName,
      importPathToName: imports.compiledImportName,
    });
  }

  if (hasEmotionCoreImportDeclaration) {
    removeEmotionCoreJSXPragma(j, collection);
    replaceEmotionCoreCSSTaggedTemplateExpression(j, collection);

    hasEmotionStyledImportDeclaration
      ? removeEmotionCoreImportDeclaration(j, collection)
      : buildCompiledImportDeclaration(j, collection);
  }

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default transformer;
