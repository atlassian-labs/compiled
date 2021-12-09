import chalk from 'chalk';
import type {
  API,
  Collection,
  FileInfo,
  Identifier,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  JSCodeshift,
  JSXIdentifier,
  Node,
  Options,
  Program,
  TSTypeParameter,
} from 'jscodeshift';

import { COMPILED_IMPORT_PATH, REACT_IMPORT_PATH, REACT_IMPORT_NAME } from '../constants';
import type { CodemodPlugin, CodemodPluginInstance } from '../plugins/types';

type Identifiers = (Identifier | JSXIdentifier | TSTypeParameter)[];

type PluginItem = CodemodPlugin | string;

const isCodemodPlugin = (pluginItem: PluginItem): pluginItem is CodemodPlugin =>
  typeof pluginItem === 'object';

const getPlugins = (
  items: PluginItem | PluginItem[]
): CodemodPlugin[] | Promise<CodemodPlugin[]> => {
  const pluginItems = Array.isArray(items) ? items : [items];
  // Remove this code block once https://github.com/facebook/jscodeshift/issues/454 is resolved
  if (pluginItems.every(isCodemodPlugin)) {
    return pluginItems;
  }

  return Promise.all(
    pluginItems.map(async (pluginItem) => {
      if (isCodemodPlugin(pluginItem)) {
        return pluginItem;
      }

      try {
        const pluginModule = await import(pluginItem);

        const pluginName = pluginModule?.default?.name;
        if (!pluginName) {
          throw new Error(
            chalk.yellow(`${chalk.bold(`Plugin at path '${pluginItem}' did not export 'name'`)}`)
          );
        }

        return pluginModule.default;
      } catch (err) {
        throw new Error(
          chalk.red(`${chalk.bold(`Plugin at path '${pluginItem}' was not loaded`)}\n${err}`)
        );
      }
    })
  );
};

/*
 * This functionality is implemented as a higher-order function as jscodeshift
 * test utilities do not support promises. This means we keep the async functionality
 * on the dynamic import
 */
export const withPlugin =
  (transformer: (fileInfo: FileInfo, api: API, options: Options) => string) =>
  (fileInfo: FileInfo, api: API, options: Options): string | Promise<string> => {
    const plugins = options.plugin ?? options.plugins ?? [];
    // TODO Await this when https://github.com/facebook/jscodeshift/issues/454 is resolved
    const maybeNormalizedPlugins = getPlugins(plugins);
    if (maybeNormalizedPlugins instanceof Promise) {
      return maybeNormalizedPlugins.then((normalizedPlugins) =>
        transformer(fileInfo, api, {
          ...options,
          normalizedPlugins,
        })
      );
    }

    return transformer(fileInfo, api, {
      ...options,
      normalizedPlugins: maybeNormalizedPlugins,
    });
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

const applyBuildImport = ({
  plugins,
  originalNode,
  specifiers,
}: {
  plugins: CodemodPluginInstance[];
  originalNode: ImportDeclaration;
  specifiers: ImportSpecifier[];
}) =>
  plugins.reduce((currentNode, plugin) => {
    const buildImportImpl = plugin.transform?.buildImport;
    if (!buildImportImpl) {
      return currentNode;
    }

    return buildImportImpl({
      originalNode,
      currentNode,
      specifiers,
      compiledImportPath: COMPILED_IMPORT_PATH,
    });
  }, originalNode);

export const convertDefaultImportToNamedImport = ({
  j,
  plugins,
  collection,
  importPath,
  namedImport,
}: {
  j: JSCodeshift;
  plugins: CodemodPluginInstance[];
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
      const newImport = applyBuildImport({
        plugins,
        originalNode: importDeclarationPath.node,
        specifiers: [
          j.importSpecifier(
            j.identifier(namedImport),
            j.identifier(getImportDefaultSpecifierName(importDefaultSpecifierCollection))
          ),
        ],
      });

      j(importDeclarationPath).replaceWith(newImport);
    }
  });
};

export const convertMixedImportToNamedImport = ({
  j,
  plugins,
  collection,
  importPath,
  defaultSourceSpecifierName,
  allowedImportSpecifierNames,
}: {
  j: JSCodeshift;
  plugins: CodemodPluginInstance[];
  collection: Collection<any>;
  importPath: string;
  defaultSourceSpecifierName: string;
  allowedImportSpecifierNames: string[];
}): void => {
  const importDeclarationCollection: Collection<ImportDeclaration> = getImportDeclarationCollection(
    {
      j,
      collection,
      importPath,
    }
  );

  importDeclarationCollection.forEach((importDeclarationPath) => {
    const newSpecifiers = (importDeclarationPath.node.specifiers || [])
      .map((specifier) => {
        if (specifier.type === 'ImportDefaultSpecifier') {
          return j.importSpecifier(
            j.identifier(defaultSourceSpecifierName),
            j.identifier(specifier.local?.name || '')
          );
        } else if (specifier.type === 'ImportSpecifier') {
          return j.importSpecifier(
            j.identifier(specifier.imported.name),
            j.identifier(specifier.local?.name || '')
          );
        }
        return undefined;
      })
      .filter((specifier): specifier is ImportSpecifier =>
        Boolean(
          specifier &&
            [defaultSourceSpecifierName, ...allowedImportSpecifierNames].includes(
              specifier?.imported.name
            )
        )
      );

    newSpecifiers.sort(({ imported: { name: nameA } }, { imported: { name: nameB } }) =>
      nameA.localeCompare(nameB)
    );

    const newImport = applyBuildImport({
      plugins,
      originalNode: importDeclarationPath.node,
      specifiers: newSpecifiers,
    });

    j(importDeclarationPath).replaceWith(newImport);
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
    const importDeclarationCollection: Collection<ImportDeclaration> =
      getImportDeclarationCollection({
        j,
        collection,
        importPath: REACT_IMPORT_PATH,
      });

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

export const applyVisitor = ({
  plugins,
  originalProgram,
  currentProgram,
}: {
  plugins: CodemodPluginInstance[];
  originalProgram: Program;
  currentProgram: Program;
}): void => {
  for (const plugin of plugins) {
    const programImpl = plugin.visitor?.program;
    if (programImpl) {
      programImpl({
        originalProgram,
        program: currentProgram,
      });
    }
  }
};
