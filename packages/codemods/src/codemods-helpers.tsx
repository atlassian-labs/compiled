import chalk from 'chalk';
import {
  JSCodeshift,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
  Program,
  Identifier,
  JSXIdentifier,
  TSTypeParameter,
  Node,
  ImportNamespaceSpecifier,
  Collection,
  FileInfo,
  API,
  Options,
} from 'jscodeshift';

import { COMPILED_IMPORT_PATH, REACT_IMPORT_PATH, REACT_IMPORT_NAME } from './constants';
import { CodemodPlugin } from './plugins/types';
import DefaultCodemodPlugin from './plugins/default';

type Identifiers = Array<Identifier | JSXIdentifier | TSTypeParameter>;

const getPlugin = async (pluginPath: string | undefined) => {
  if (pluginPath) {
    try {
      const pluginModule = await import(pluginPath);
      return pluginModule.default;
    } catch (err) {
      throw new Error(
        chalk.red(`${chalk.bold(`Plugin at path '${pluginPath}' was not loaded`)}\n${err}`)
      );
    }
  }
  return null;
};

/*
 * This functionality is implemented as a higher-order function as jscodeshift
 * test utilities do not support promises. This means we keep the async functionality
 * on the dynamic import
 */
export const withPlugin = (
  transformer: (fileInfo: FileInfo, api: API, options: Options) => string
) => async (fileInfo: FileInfo, api: API, options: Options): Promise<string> => {
  options.pluginModule = await getPlugin(options.plugin);
  return transformer(fileInfo, api, options);
};

export const getImportDeclarationCollection = ({
  j,
  collection,
  importPath,
}: {
  j: JSCodeshift;
  collection: Collection<any>;
  importPath: string;
}): Collection<ImportDeclaration> => {
  const found: Collection<ImportDeclaration> = collection
    .find(j.ImportDeclaration)
    .filter((importDeclarationPath) => importDeclarationPath.node.source.value === importPath);

  return found;
};

export const hasImportDeclaration = ({
  j,
  collection,
  importPath,
}: {
  j: JSCodeshift;
  collection: Collection<any>;
  importPath: string;
}): boolean => {
  const result: Collection<ImportDeclaration> = getImportDeclarationCollection({
    j,
    collection,
    importPath,
  });

  return result.length > 0;
};

export const getImportDefaultSpecifierName = (
  importDefaultSpecifierCollection: Collection<ImportDefaultSpecifier>
): string => {
  const name = importDefaultSpecifierCollection.nodes()[0]!.local!.name;
  if (!name) {
    throw new Error('Name should exist.');
  }

  return name;
};

export const getImportSpecifierName = (
  importSpecifierCollection: Collection<ImportSpecifier>
): string | undefined => importSpecifierCollection.nodes()[0]!.local!.name;

export const getAllImportSpecifiers = ({
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

export const findImportSpecifierName = ({
  j,
  importDeclarationCollection,
  importName,
}: {
  j: JSCodeshift;
  importDeclarationCollection: Collection<ImportDeclaration>;
  importName: string;
}): string | null | undefined => {
  const importSpecifierCollection: Collection<ImportSpecifier> = importDeclarationCollection
    .find(j.ImportSpecifier)
    .filter((importSpecifierPath) => importSpecifierPath.node.imported.name === importName);

  if (importSpecifierCollection.length === 0) {
    return null;
  }

  return getImportSpecifierName(importSpecifierCollection);
};

export const convertDefaultImportToNamedImport = ({
  j,
  plugin,
  collection,
  importPath,
  namedImport,
}: {
  j: JSCodeshift;
  plugin: CodemodPlugin | null;
  collection: Collection<any>;
  importPath: string;
  namedImport: string;
}): void => {
  const importDeclarationCollection: Collection<ImportDeclaration> = getImportDeclarationCollection(
    {
      j,
      collection,
      importPath,
    }
  );

  importDeclarationCollection.forEach((importDeclarationPath) => {
    const importDefaultSpecifierCollection = j(importDeclarationPath).find(
      j.ImportDefaultSpecifier
    );

    if (importDefaultSpecifierCollection.length > 0) {
      const newImport = j(importDeclarationPath).replaceWith(
        (plugin?.buildImport ?? DefaultCodemodPlugin.buildImport)({
          j,
          currentNode: importDeclarationPath.node,
          defaultSpecifierName: getImportDefaultSpecifierName(importDefaultSpecifierCollection),
          namedImport,
          compiledImportPath: COMPILED_IMPORT_PATH,
        })
      );

      const insertBeforeNodes = (
        plugin?.insertBeforeImport ?? DefaultCodemodPlugin.insertBeforeImport
      )({ j, newImport });
      if (insertBeforeNodes) newImport.insertBefore(insertBeforeNodes);

      const insertAfterNodes = (
        plugin?.insertAfterImport ?? DefaultCodemodPlugin.insertAfterImport
      )({ j, newImport });
      if (insertAfterNodes) newImport.insertAfter(insertAfterNodes);
    }
  });
};

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

export const addCommentToStartOfFile = ({
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

export const addReactIdentifier = ({
  j,
  collection,
}: {
  j: JSCodeshift;
  collection: Collection<Node>;
}): void => {
  const hasReactImportDeclaration: boolean = hasImportDeclaration({
    j,
    collection,
    importPath: REACT_IMPORT_PATH,
  });

  if (!hasReactImportDeclaration) {
    collection.find(j.Program).forEach((programPath) => {
      programPath.node.body.unshift(
        j.importDeclaration(
          [j.importNamespaceSpecifier(j.identifier(REACT_IMPORT_NAME))],
          j.literal(REACT_IMPORT_PATH)
        )
      );
    });
  } else {
    const importDeclarationCollection: Collection<ImportDeclaration> = getImportDeclarationCollection(
      {
        j,
        collection,
        importPath: REACT_IMPORT_PATH,
      }
    );

    importDeclarationCollection.forEach((importDeclarationPath) => {
      const importDefaultSpecifierCollection: Collection<ImportDefaultSpecifier> = j(
        importDeclarationPath
      ).find(j.ImportDefaultSpecifier);
      const importNamespaceSpecifierCollection: Collection<ImportNamespaceSpecifier> = j(
        importDeclarationPath
      ).find(j.ImportNamespaceSpecifier);

      const hasNoDefaultReactImportDeclaration = importDefaultSpecifierCollection.length === 0;
      const hasNoNamespaceReactImportDeclaration = importNamespaceSpecifierCollection.length === 0;

      if (
        hasNoDefaultReactImportDeclaration &&
        hasNoNamespaceReactImportDeclaration &&
        importDeclarationPath.node.specifiers
      ) {
        importDeclarationPath.node.specifiers.unshift(
          j.importDefaultSpecifier(j.identifier(REACT_IMPORT_NAME))
        );
      }
    });
  }
};

export const replaceImportDeclaration = ({
  j,
  collection,
  importPath,
}: {
  j: JSCodeshift;
  collection: Collection<Node>;
  importPath: string;
}): void => {
  const importDeclarationCollection: Collection<ImportDeclaration> = getImportDeclarationCollection(
    {
      j,
      collection,
      importPath,
    }
  );

  importDeclarationCollection.forEach((importDeclarationPath) => {
    importDeclarationPath.node.source.value = COMPILED_IMPORT_PATH;
  });
};

export const mergeImportSpecifiersAlongWithTheirComments = ({
  j,
  collection,
  filter = (_) => true,
}: {
  j: JSCodeshift;
  collection: Collection<Node>;
  filter?: (name: string | undefined) => boolean;
}): void => {
  const importDeclarationCollection: Collection<ImportDeclaration> = getImportDeclarationCollection(
    {
      j,
      collection,
      importPath: COMPILED_IMPORT_PATH,
    }
  );

  const importSpecifiers: ImportSpecifier[] = [];

  importDeclarationCollection
    .find(j.ImportSpecifier)
    .filter((importSpecifierPath) => filter(importSpecifierPath.node.imported.name))
    .forEach((importSpecifierPath) => {
      importSpecifiers.push(importSpecifierPath.node);
    });

  const importDeclarationCollectionLength = importDeclarationCollection.length;
  const importDeclarationComments: Node['comments'] = [];

  importDeclarationCollection.forEach((importDeclarationPath, index) => {
    const oldNode = importDeclarationPath.node;
    const { comments } = oldNode;

    if (comments) {
      importDeclarationComments.push(...comments);
    }

    if (index === importDeclarationCollectionLength - 1) {
      j(importDeclarationPath).replaceWith([
        j.importDeclaration(importSpecifiers, j.literal(COMPILED_IMPORT_PATH)),
      ]);

      const newNode = importDeclarationPath.node;

      if (newNode !== oldNode) {
        newNode.comments = importDeclarationComments;
      }
    } else {
      j(importDeclarationPath).remove();
    }
  });
};
