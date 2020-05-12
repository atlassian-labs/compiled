import ts from 'typescript';
import { TransformerOptions, AnyTokens } from '../../types';
import * as constants from '../../constants';
import {
  createJsxClosingElement,
  isPackageModuleImport,
  createJsxOpeningElement,
} from '../../utils/ast-node';
import { getTokenCssVariable } from '../../utils/theme';

export const isCreateThemeProviderFound = (sourceFile: ts.SourceFile): boolean => {
  return !!sourceFile.statements.find((statement) =>
    isPackageModuleImport(statement, constants.CREATE_THEME_PROVIDER_IMPORT)
  );
};

export const isCreateThemeProviderCall = (node: ts.Node): node is ts.CallExpression => {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === constants.CREATE_THEME_PROVIDER_IMPORT
  );
};

const buildThemeObject = (opts: TransformerOptions) => {
  const tokens = opts.tokens;
  if (!tokens) {
    throw new Error('wheres the tokens');
  }

  const tokensToNestedLiteral = (obj: AnyTokens, parentKey = ''): ts.ObjectLiteralExpression => {
    return ts.createObjectLiteral(
      Object.entries(obj).map(([key, value]) => {
        const actualValue =
          typeof value === 'object'
            ? tokensToNestedLiteral(value, parentKey + key)
            : ts.createStringLiteral(
                getTokenCssVariable(parentKey + key, {
                  tokenPrefix: opts.tokenPrefix,
                  useVariable: true,
                  defaultValue: tokens.base[value],
                })
              );

        return ts.createPropertyAssignment(ts.createIdentifier(key), actualValue);
      }),
      false
    );
  };

  return tokensToNestedLiteral(tokens.default);
};

export const visitCreateThemeProvider = (
  node: ts.CallExpression,
  context: ts.TransformationContext,
  opts: TransformerOptions
): ts.Node => {
  return ts.createObjectLiteral(
    [
      ts.createPropertyAssignment(
        ts.createIdentifier(constants.TOKENS_GETTER_NAME),
        buildThemeObject(opts)
      ),
      ts.createPropertyAssignment(
        ts.createIdentifier(constants.THEME_PROVIDER_NAME),
        ts.createArrowFunction(
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
        )
      ),
    ],
    false
  );
};
