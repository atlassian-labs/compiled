import ts from 'typescript';
import { TransformerOptions } from '../../types';
import * as constants from '../../constants';
import { isPackageModuleImport } from '../../utils/ast-node';

export const isCreateVariantsFound = (sourceFile: ts.SourceFile): boolean => {
  return !!sourceFile.statements.find((statement) =>
    isPackageModuleImport(statement, constants.CREATE_VARIANTS_IMPORT)
  );
};

export const isCreateVariantsCall = (node: ts.Node): node is ts.CallExpression => {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === constants.CREATE_VARIANTS_IMPORT
  );
};

export const visitCreateVariants = (
  node: ts.CallExpression,
  __: ts.TransformationContext,
  ___: TransformerOptions
): ts.Node => {
  return node;
};
