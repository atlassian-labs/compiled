import * as ts from 'typescript';
import * as log from './log';
import * as constants from '../constants';

const COMPILED_PKG = '@compiled/css-in-js';

export const visitSourceFileEnsureStyleImport = (
  sourceFile: ts.SourceFile,
  context: ts.TransformationContext,
  opts: {
    removeNamedImport?: string;
  } = {}
): ts.SourceFile => {
  const visitor = (node: ts.Node): ts.Node => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === COMPILED_PKG
    ) {
      log.log('ensuring style export is defined');

      const defaultImport = node.importClause && node.importClause.name;
      let namedImports: ts.ImportSpecifier[] = [];

      if (
        node.importClause &&
        node.importClause.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings)
      ) {
        namedImports = Array.from(node.importClause.namedBindings.elements).filter(imp => {
          if (opts.removeNamedImport) {
            return imp.name.text !== opts.removeNamedImport;
          }

          return true;
        });
      }

      if (!namedImports.some(val => val.name.text === constants.COMPILED_STYLE_COMPONENT_NAME)) {
        // "Style" isn't being imported yet. Add it!
        namedImports = [
          ts.createImportSpecifier(
            undefined,
            ts.createIdentifier(constants.COMPILED_STYLE_COMPONENT_NAME)
          ),
        ].concat(namedImports);
      }

      if (!namedImports.some(val => val.name.text === constants.COMPILED_COMPONENT_NAME)) {
        // "CC" isn't being imported yet. Add it!
        namedImports = [
          ts.createImportSpecifier(
            undefined,
            ts.createIdentifier(constants.COMPILED_COMPONENT_NAME)
          ),
        ].concat(namedImports);
      }

      return ts.updateImportDeclaration(
        node,
        /* decorators */ undefined,
        /* modifiers */ undefined,
        ts.createImportClause(defaultImport, ts.createNamedImports(namedImports)),
        node.moduleSpecifier
      );
    }

    return ts.visitEachChild(node, visitor, context);
  };

  return ts.visitNode(sourceFile, visitor);
};
