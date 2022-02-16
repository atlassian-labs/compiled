import type {
  Collection,
  ImportDeclaration,
  JSCodeshift,
  Node,
  Program,
  Identifier,
  JSXIdentifier,
  TSTypeParameter,
} from 'jscodeshift';

import { COMPILED_IMPORT_PATH } from '../constants';

import { getImportDeclarationCollection } from './import-declarations';

type Identifiers = (Identifier | JSXIdentifier | TSTypeParameter)[];

// not replacing newlines (which \s does)
const spacesAndTabs = /[ \t]{2,}/g;
const lineStartWithSpaces = /^[ \t]*/gm;

const clean = (value: string) =>
  value
    .replace(spacesAndTabs, ' ')
    .replace(lineStartWithSpaces, '')
    // using .trim() to clear the any newlines before the first text and after last text
    .trim();

export const addCommentBefore = ({
  j,
  collection,
  message,
}: {
  j: JSCodeshift;
  collection: Collection<Program>;
  message: string;
}): void => {
  const content = ` TODO(${COMPILED_IMPORT_PATH} codemod): ${clean(message)} `;
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

const getAllImportSpecifiers = ({
  j,
  importDeclarationCollection,
}: {
  j: JSCodeshift;
  importDeclarationCollection: Collection<ImportDeclaration>;
}): Identifiers => {
  const importSpecifiersImportedNodes: Identifiers = [];

  importDeclarationCollection.find(j.ImportSpecifier).forEach((importSpecifierPath) => {
    const node = importSpecifierPath.node.imported;

    if (node) {
      importSpecifiersImportedNodes.push(node);
    }
  });

  return importSpecifiersImportedNodes;
};

const addCommentToStartOfFile = ({
  j,
  collection,
  message,
}: {
  j: JSCodeshift;
  collection: Collection<Node>;
  message: string;
}): void => {
  addCommentBefore({
    j,
    collection: collection.find(j.Program),
    message,
  });
};

export const addCommentForUnresolvedImportSpecifiers = ({
  j,
  collection,
  importPath,
  allowedImportSpecifierNames,
}: {
  j: JSCodeshift;
  collection: Collection<Node>;
  importPath: string;
  allowedImportSpecifierNames: string[];
}): void => {
  const importDeclarationCollection: Collection<ImportDeclaration> = getImportDeclarationCollection(
    {
      j,
      collection,
      importPath,
    }
  );
  const importSpecifiers: Identifiers = getAllImportSpecifiers({
    j,
    importDeclarationCollection,
  });

  importSpecifiers
    .filter((identifierPath) => !allowedImportSpecifierNames.includes(identifierPath.name))
    .forEach((importSpecifierPath) => {
      addCommentToStartOfFile({
        j,
        collection,
        message: `"${importSpecifierPath.name}" is not exported from "${COMPILED_IMPORT_PATH}" at the moment. Please find an alternative for it.`,
      });
    });
};
