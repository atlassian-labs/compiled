import {
  JSCodeshift,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
  Program,
  Identifier,
  JSXIdentifier,
  TSTypeParameter,
} from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';

export const getImportDeclarationCollection = ({
  j,
  collection,
  importPath,
}: {
  j: JSCodeshift;
  collection: Collection<any>;
  importPath: string;
}) =>
  collection
    .find(j.ImportDeclaration)
    .filter((importDeclarationPath) => importDeclarationPath.node.source.value === importPath);

export const hasImportDeclaration = ({
  j,
  collection,
  importPath,
}: {
  j: JSCodeshift;
  collection: Collection<any>;
  importPath: string;
}) =>
  getImportDeclarationCollection({
    j,
    collection,
    importPath,
  }).length > 0;

export const getImportDefaultSpecifierName = (
  importDefaultSpecifierCollection: Collection<ImportDefaultSpecifier>
) => importDefaultSpecifierCollection.nodes()[0]!.local!.name;

export const getImportSpecifierName = (importSpecifierCollection: Collection<ImportSpecifier>) =>
  importSpecifierCollection.nodes()[0]!.local!.name;

export const getAllImportSpecifiers = ({
  j,
  importDeclarationCollection,
}: {
  j: JSCodeshift;
  importDeclarationCollection: Collection<ImportDeclaration>;
}) => {
  const importSpecifiers: (Identifier | JSXIdentifier | TSTypeParameter)[] = [];

  importDeclarationCollection.find(j.ImportSpecifier).forEach((importSpecifierPath) => {
    const node = importSpecifierPath.node.imported;

    if (node) {
      importSpecifiers.push(node);
    }
  });

  return importSpecifiers;
};

export const findImportSpecifierName = ({
  j,
  importDeclarationCollection,
  importName,
}: {
  j: JSCodeshift;
  importDeclarationCollection: Collection<ImportDeclaration>;
  importName: string;
}) => {
  const importSpecifierCollection = importDeclarationCollection
    .find(j.ImportSpecifier)
    .filter((importSpecifierPath) => importSpecifierPath.node.imported.name === importName);

  if (importSpecifierCollection.length === 0) {
    return null;
  }

  return getImportSpecifierName(importSpecifierCollection);
};

export const buildDefaultImportDeclaration = ({
  j,
  collection,
  importPathFrom,
  importPathTo,
  importPathToName,
}: {
  j: JSCodeshift;
  collection: Collection<any>;
  importPathFrom: string;
  importPathTo: string;
  importPathToName: string;
}) => {
  const importDeclarationCollection = getImportDeclarationCollection({
    j,
    collection,
    importPath: importPathFrom,
  });

  importDeclarationCollection.forEach((importDeclarationPath) => {
    const importDefaultSpecifierCollection = j(importDeclarationPath).find(
      j.ImportDefaultSpecifier
    );

    if (importDefaultSpecifierCollection.length > 0) {
      const oldNode = importDeclarationPath.node;
      const { comments } = oldNode;

      j(importDeclarationPath).replaceWith([
        j.importDeclaration(
          [
            j.importSpecifier(
              j.identifier(importPathToName),
              j.identifier(getImportDefaultSpecifierName(importDefaultSpecifierCollection))
            ),
          ],
          j.literal(importPathTo)
        ),
      ]);

      const newNode = importDeclarationPath.node;

      if (newNode !== oldNode) {
        newNode.comments = comments;
      }
    }
  });
};

// not replacing newlines (which \s does)
const spacesAndTabs = /[ \t]{2,}/g;
const lineStartWithSpaces = /^[ \t]*/gm;

function clean(value: string): string {
  return (
    value
      .replace(spacesAndTabs, ' ')
      .replace(lineStartWithSpaces, '')
      // using .trim() to clear the any newlines before the first text and after last text
      .trim()
  );
}

export const addCommentBefore = ({
  j,
  collection,
  message,
}: {
  j: JSCodeshift;
  collection: Collection<Program>;
  message: string;
}) => {
  const content = ` TODO(@compiled/react codemod): ${clean(message)} `;
  collection.forEach((path) => {
    path.value.comments = path.value.comments || [];

    const exists = path.value.comments.find((comment) => comment.value === content);

    // avoiding duplicates of the same comment
    if (exists) {
      return;
    }

    path.value.comments.push(j.commentBlock(content));
  });
};

export const addCommentToStartOfFile = ({
  j,
  collection,
  message,
}: {
  j: JSCodeshift;
  collection: Collection<Node>;
  message: string;
}) => {
  addCommentBefore({
    j,
    collection: collection.find(j.Program),
    message,
  });
};
