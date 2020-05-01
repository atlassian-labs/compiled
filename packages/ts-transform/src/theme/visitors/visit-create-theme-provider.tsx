import ts from 'typescript';
import { TransformerOptions } from '../../types';
import * as constants from '../../constants';
import { createJsxClosingElement, createJsxOpeningElement } from '../../utils/ast-node';

export const visitCreateThemeProvider = (
  node: ts.CallExpression,
  context: ts.TransformationContext,
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
        ts.createIdentifier('props'),
        undefined,
        undefined,
        undefined
      ),
    ],
    undefined,
    ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.createParen(
      ts.createJsxElement(
        createJsxOpeningElement(
          node,
          constants.getThemeComponentImport(context),
          undefined,
          ts.createJsxAttributes([ts.createJsxSpreadAttribute(ts.createIdentifier('props'))])
        ),
        [
          ts.createJsxExpression(
            undefined,
            ts.createCall(
              ts.createPropertyAccess(
                ts.createIdentifier('props'),
                ts.createIdentifier('children')
              ),
              undefined,
              [
                ts.createElementAccess(
                  ts.createIdentifier(constants.TOKENS_OBJECT_NAME),
                  ts.createPropertyAccess(
                    ts.createIdentifier('props'),
                    ts.createIdentifier(constants.THEME_MODE_NAME)
                  )
                ),
              ]
            )
          ),
        ],
        createJsxClosingElement(node, constants.getThemeComponentImport(context))
      )
    )
  );
};
