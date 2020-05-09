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
  _: ts.CallExpression,
  __: ts.TransformationContext,
  ___: TransformerOptions
): ts.Node => {
  return ts.createArrowFunction(
    undefined,
    undefined,
    [
      ts.createParameter(
        undefined,
        undefined,
        undefined,
        ts.createIdentifier('variant'),
        undefined,
        ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        undefined
      ),
    ],
    undefined,
    ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.createBlock(
      [
        ts.createVariableStatement(
          undefined,
          ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                ts.createIdentifier(constants.THEME_MODE_NAME),
                undefined,
                ts.createCall(ts.createIdentifier(constants.USE_MODE_NAME), undefined, [])
              ),
            ],
            ts.NodeFlags.Const
          )
        ),
        ts.createVariableStatement(
          undefined,
          ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                ts.createIdentifier('defaultVariant'),
                undefined,
                ts.createPropertyAccess(
                  ts.createIdentifier(constants.LOCAL_VARIANTS_NAME),
                  ts.createIdentifier('default')
                )
              ),
            ],
            ts.NodeFlags.Const
          )
        ),
        ts.createReturn(
          ts.createObjectLiteral(
            [
              ts.createSpreadAssignment(
                ts.createPropertyAccess(
                  ts.createIdentifier('defaultVariant'),
                  ts.createIdentifier('default')
                )
              ),
              ts.createSpreadAssignment(
                ts.createElementAccess(
                  ts.createIdentifier('defaultVariant'),
                  ts.createIdentifier(constants.THEME_MODE_NAME)
                )
              ),
              ts.createSpreadAssignment(
                ts.createElementAccess(
                  ts.createElementAccess(
                    ts.createIdentifier(constants.LOCAL_VARIANTS_NAME),
                    ts.createIdentifier('variant')
                  ),
                  ts.createIdentifier(constants.THEME_MODE_NAME)
                )
              ),
            ],
            true
          )
        ),
      ],
      true
    )
  );
};
