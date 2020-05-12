import * as ts from 'typescript';
import {
  visitCreateThemeProvider,
  isCreateThemeProviderCall,
} from './visitors/visit-create-theme-provider';
import { visitSourceFileEnsureDefaultReactImport } from '../utils/visit-source-file-ensure-default-react-import';
import { visitSourceFileEnsureStyleImport } from '../utils/visit-source-file-ensure-style-import';
import {
  TOKENS_OBJECT_NAME,
  CREATE_THEME_PROVIDER_IMPORT,
  COMPILED_THEME_NAME,
  BASE_TOKENS,
  TOKENS_GETTER_NAME,
} from '../constants';
import { TransformerOptions, Tokens, AnyTokens } from '../types';
import { getTokenCssVariable } from '../utils/theme';
import { getPropertyAccessExpressionIdentifiers } from '../utils/ast-node';

const buildTokensObject = (tokens: Tokens, tokenPrefix?: string) => {
  const { [BASE_TOKENS]: baseTokens, ...themes } = tokens;

  const flattenObject = (
    tokenObject: AnyTokens,
    parentKey = ''
  ): { [key: string]: number | string } => {
    return Object.entries(tokenObject).reduce((acc, [key, value]) => {
      if (typeof value === 'object') {
        return Object.assign(acc, flattenObject(value, parentKey + key));
      }

      return Object.assign(acc, { [parentKey + key]: value });
    }, {});
  };

  const objectToLiteral = (obj: { [key: string]: number | string }): ts.ObjectLiteralExpression => {
    return ts.createObjectLiteral(
      Object.entries(obj).map(([key, value]) => {
        const actualValue = baseTokens[value] || value;
        const valueNode =
          typeof actualValue === 'string'
            ? ts.createStringLiteral(actualValue)
            : ts.createNumericLiteral(`${actualValue}`);

        return ts.createPropertyAssignment(
          ts.createStringLiteral(getTokenCssVariable(key, { tokenPrefix })),
          valueNode
        );
      })
    );
  };

  return ts.createObjectLiteral(
    Object.entries(themes).map(([themeName, themeValue]) => {
      return ts.createPropertyAssignment(
        ts.createStringLiteral(themeName),
        objectToLiteral(flattenObject(themeValue))
      );
    }),
    false
  );
};

const isTokensGetterAccess = (node: ts.Node): node is ts.PropertyAccessExpression => {
  if (!ts.isPropertyAccessExpression(node)) {
    return false;
  }

  let nextPropertyAccess: ts.PropertyAccessExpression = node;

  while (ts.isPropertyAccessExpression(nextPropertyAccess.expression)) {
    nextPropertyAccess = nextPropertyAccess.expression;
  }

  return (
    ts.isIdentifier(nextPropertyAccess.expression) &&
    nextPropertyAccess.expression.text === TOKENS_GETTER_NAME
  );
};

export default function themeTransformer(
  _: ts.Program,
  options: TransformerOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      if (!options.tokens) {
        return sourceFile;
      }

      const tokens = options.tokens;

      const transformedSourceFile = visitSourceFileEnsureDefaultReactImport(
        visitSourceFileEnsureStyleImport(sourceFile, context, {
          removeNamedImport: CREATE_THEME_PROVIDER_IMPORT,
          imports: [COMPILED_THEME_NAME],
        }),
        context
      );

      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        if (
          ts.isVariableStatement(node) &&
          node.declarationList.declarations[0].initializer &&
          isCreateThemeProviderCall(node.declarationList.declarations[0].initializer)
        ) {
          return [
            ts.createVariableDeclarationList(
              [
                ts.createVariableDeclaration(
                  ts.createIdentifier(TOKENS_OBJECT_NAME),
                  undefined,
                  buildTokensObject(tokens, options.tokenPrefix)
                ),
              ],
              ts.NodeFlags.Const
            ),
            ts.visitEachChild(node, visitor, context),
          ];
        }

        if (isCreateThemeProviderCall(node)) {
          return visitCreateThemeProvider(node, context, options);
        }

        if (isTokensGetterAccess(node)) {
          const identifiers = getPropertyAccessExpressionIdentifiers(node);
          const key = identifiers.join('');

          let value = tokens.default[identifiers.shift()!];

          while (identifiers.length && typeof value === 'object') {
            value = value[identifiers.shift()!];
          }

          if (!value || typeof value === 'object') {
            return node;
          }

          const actualValue = tokens.base[value];
          if (!actualValue) {
            return node;
          }

          const varValue = getTokenCssVariable(key, {
            tokenPrefix: options.tokenPrefix,
            useVariable: true,
            defaultValue: actualValue,
          });

          return ts.createStringLiteral(varValue);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
