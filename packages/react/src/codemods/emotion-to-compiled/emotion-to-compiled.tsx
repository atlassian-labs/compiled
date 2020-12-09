import core, { FileInfo, API, Options, Collection, ASTPath, CommentBlock } from 'jscodeshift';

import {
  hasImportDeclaration,
  getImportDeclarationCollection,
  findImportSpecifierName,
  buildDefaultImportDeclaration,
  addCommentToStartOfFile,
  getAllImportSpecifiers,
} from '../codemods-helpers';

const imports = {
  compiledPackageName: '@compiled/react',
  compiledImportName: 'styled',
  emotionStyledPackageName: '@emotion/styled',
  emotionCoreJSXPragma: '@jsx jsx',
  emotionCoreImportNames: { jsx: 'jsx', css: 'css' },
  emotionCorePackageName: '@emotion/core',
  reactImportName: 'React',
  reactPackageName: 'react',
};

const addReactIdentifier = (j: core.JSCodeshift, collection: Collection) => {
  const hasReactImportDeclaration = hasImportDeclaration({
    j,
    collection,
    importPath: imports.reactPackageName,
  });

  if (!hasReactImportDeclaration) {
    collection.find(j.Program).forEach((programPath) => {
      programPath.node.body.unshift(
        j.importDeclaration(
          [j.importNamespaceSpecifier(j.identifier(imports.reactImportName))],
          j.literal(imports.reactPackageName)
        )
      );
    });
  } else {
    const importDeclarationCollection = getImportDeclarationCollection({
      j,
      collection,
      importPath: imports.reactPackageName,
    });

    importDeclarationCollection.forEach((importDeclarationPath) => {
      const importDefaultSpecifierCollection = j(importDeclarationPath).find(
        j.ImportDefaultSpecifier
      );
      const importNamespaceSpecifierCollection = j(importDeclarationPath).find(
        j.ImportNamespaceSpecifier
      );

      const hasNoDefaultReactImportDeclaration = importDefaultSpecifierCollection.length === 0;
      const hasNoNamespaceReactImportDeclaration = importNamespaceSpecifierCollection.length === 0;

      if (hasNoDefaultReactImportDeclaration && hasNoNamespaceReactImportDeclaration) {
        importDeclarationPath.node.specifiers.unshift(
          j.importDefaultSpecifier(j.identifier(imports.reactImportName))
        );
      }
    });
  }
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

      addReactIdentifier(j, collection);
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

const addCommentBeforeUnresolvedIdentifiers = (j: core.JSCodeshift, collection: Collection) => {
  const importDeclarationCollection = getImportDeclarationCollection({
    j,
    collection,
    importPath: imports.emotionCorePackageName,
  });
  const importSpecifiers = getAllImportSpecifiers({
    j,
    importDeclarationCollection,
  });

  const emotionCoreImportValues = Object.values(imports.emotionCoreImportNames);

  importSpecifiers
    .filter((identifierPath) => !emotionCoreImportValues.includes(identifierPath.name))
    .forEach((importSpecifierPath) => {
      collection.find(j.Identifier).some((identifierPath) => {
        const name = identifierPath.node.name;

        const isValidIdentiferFound = name === importSpecifierPath.name;

        if (isValidIdentiferFound) {
          addCommentToStartOfFile({
            j,
            collection,
            message: `
              "${name}" is not exported from "${imports.compiledPackageName}" at the moment. Please find an alternative for it.
            `,
          });

          return true;
        }

        return false;
      });
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
    const oldNode = importDeclarationPath.node;
    const { comments } = oldNode;

    j(importDeclarationPath).replaceWith([
      j.importDeclaration([], j.literal(imports.compiledPackageName)),
    ]);

    const newNode = importDeclarationPath.node;

    if (newNode !== oldNode) {
      newNode.comments = comments;
    }
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

  if (hasEmotionCoreImportDeclaration) {
    removeEmotionCoreJSXPragma(j, collection);
    addCommentBeforeUnresolvedIdentifiers(j, collection);
    replaceEmotionCoreCSSTaggedTemplateExpression(j, collection);

    hasEmotionStyledImportDeclaration
      ? removeEmotionCoreImportDeclaration(j, collection)
      : buildCompiledImportDeclaration(j, collection);
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

  return collection.toSource(options.printOptions || { quote: 'single' });
};

export default transformer;
