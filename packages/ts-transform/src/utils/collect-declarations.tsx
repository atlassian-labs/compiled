import * as ts from 'typescript';
import { Declarations } from '../types';
import { getIdentifierText, getExpressionText } from './ast-node';
import * as logger from './log';

/**
 * Will return `true` if any declarations were collected from the node.
 * @param node
 * @param program
 * @param outDeclarationsMap
 */
export const collectDeclarationsFromNode = (
  node: ts.Node,
  program: ts.Program,
  outDeclarationsMap: Declarations
): boolean => {
  if (ts.isVariableDeclaration(node) || ts.isBindingElement(node)) {
    // we may need this later, let's store it in a POJO for quick access.
    if (ts.isIdentifier(node.name)) {
      outDeclarationsMap[getIdentifierText(node.name)] = node;
      return true;
    }
  }

  if (ts.isFunctionDeclaration(node) && node.name) {
    outDeclarationsMap[getIdentifierText(node.name)] = node;
    return true;
  }

  if (ts.isImportDeclaration(node)) {
    // we may use these. store for later and if needed then resolve them.
    const typeChecker = program.getTypeChecker();
    const importSymbol = typeChecker.getSymbolAtLocation(node.moduleSpecifier);
    if (!importSymbol) {
      logger.log(`symbol for ${getExpressionText(node.moduleSpecifier)} was undefined`);
      return false;
    }

    const exportSymbols = typeChecker.getExportsOfModule(importSymbol);
    exportSymbols.forEach((exportSymbol) => {
      if (!exportSymbol.valueDeclaration) {
        logger.log('declaration is undefined - skipping');
        return;
      }

      if (ts.isVariableDeclaration(exportSymbol.valueDeclaration)) {
        outDeclarationsMap[exportSymbol.getName()] = exportSymbol.valueDeclaration;
        return;
      }

      if (ts.isFunctionDeclaration(exportSymbol.valueDeclaration)) {
        outDeclarationsMap[exportSymbol.getName()] = exportSymbol.valueDeclaration;
        return;
      }

      logger.log('only variable exports supported atm - skipping');
    });

    return true;
  }

  return false;
};
