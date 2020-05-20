import * as ts from 'typescript';
import * as log from './log';
import * as constants from '../constants';

const COMPILED_PKG = '@compiled/css-in-js';
const COMPILED_STYLE_PKG = '@compiled/style';

interface Opts {
  imports?: string[];
  removeNamedImport?: string;
}

const isStylePkgFound = (sourceFile: ts.SourceFile | ts.ModuleBlock): boolean => {
  return !!sourceFile.statements.find(
    (statement: ts.Node) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith(COMPILED_STYLE_PKG)
  );
};

export const visitSourceFileEnsureStyleImport = (
  sourceFile: ts.SourceFile,
  context: ts.TransformationContext,
  {
    imports = [constants.COMPILED_COMPONENT_NAME, constants.COMPILED_STYLE_COMPONENT_NAME],
    removeNamedImport,
  }: Opts = {}
): ts.SourceFile => {
  const visitor = (node: ts.Node): ts.Node | Array<ts.Node> | undefined => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === COMPILED_PKG
    ) {
      log.log('ensuring style export is defined');

      let namedImports: ts.ImportSpecifier[] = [];

      // remove namedImports that have been flagged for removal.
      if (
        node.importClause &&
        node.importClause.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings)
      ) {
        namedImports = Array.from(node.importClause.namedBindings.elements).filter(imp => {
          const filteredImports = [...imports];
          if (removeNamedImport) {
            filteredImports.push(removeNamedImport);
          }

          return !filteredImports.includes(imp.name.text);
        });
      }

      const updatedNode = ts.updateImportDeclaration(
        node,
        /* decorators */ undefined,
        /* modifiers */ undefined,
        ts.createImportClause(undefined, ts.createNamedImports(namedImports)),
        node.moduleSpecifier
      );
      // if we hit an import we should check if any sibling nodes are
      // @compiled/style
      if (!isStylePkgFound(sourceFile)) {
        // Add the package
        // update the importSpecifier appropriately.

        const styleImports = imports.map(name => {
          return ts.createImportSpecifier(undefined, ts.createIdentifier(name));
        });

        const styleImportDeclaration = ts.createImportDeclaration(
          /* decorators */ undefined,
          /* modifiers */ undefined,
          ts.createImportClause(undefined, ts.createNamedImports(styleImports)),
          ts.createLiteral(COMPILED_STYLE_PKG)
        );

        return namedImports.length ? [updatedNode, styleImportDeclaration] : styleImportDeclaration;
      } else {
        // if it is found, check the length of the namedImports array
        // if its 0, remove the namedImports node.
        return namedImports.length ? updatedNode : undefined;
      }
    }

    return ts.visitEachChild(node, visitor, context);
  };

  return ts.visitNode(sourceFile, visitor);
};
