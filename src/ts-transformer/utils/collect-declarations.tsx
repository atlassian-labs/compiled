import * as ts from 'typescript';
import { VariableDeclarations } from '../types';
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
  outDeclarationsMap: VariableDeclarations
): boolean => {
  if (ts.isVariableDeclaration(node)) {
    // we may need this later, let's store it in a POJO for quick access.
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
    exportSymbols.forEach(exportSymbol => {
      if (
        // valueDeclaration can be undefined believe it or not.
        exportSymbol.valueDeclaration &&
        !ts.isVariableDeclaration(exportSymbol.valueDeclaration)
      ) {
        throw new Error('only variable exports supported atm');
      }

      outDeclarationsMap[exportSymbol.getName()] = exportSymbol.valueDeclaration;
    });

    return true;
  }

  return false;
};
