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
import { TransformerOptions, Tokens } from '../types';
import { getTokenCssVariable } from '../utils/theme';

const buildTokensObject = (tokens: Tokens, tokenPrefix?: string) => {
  const themes = Object.keys(tokens).filter((themeName) => themeName !== BASE_TOKENS);

  return ts.createObjectLiteral(
    themes.map((name) => {
      const themeTokens = Object.entries(tokens[name]).map(([key, value]) => ({
        key: getTokenCssVariable(key, { tokenPrefix }),
        value: tokens.base[value],
      }));

      return ts.createPropertyAssignment(
        ts.createStringLiteral(name),
        ts.createObjectLiteral(
          themeTokens.map((themeToken) =>
            ts.createPropertyAssignment(
              ts.createStringLiteral(themeToken.key),
              ts.createStringLiteral(themeToken.value)
            )
          ),
          false
        )
      );
    }),
    false
  );
};

const isTokensGetterAccess = (node: ts.Node): node is ts.PropertyAccessExpression => {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === TOKENS_GETTER_NAME
  );
};

export default function themeTransformer(
  _: ts.Program,
  options: TransformerOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      if (!options.tokens) {
        throw new Error('define your tokens');
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
          const key = node.name.text;
          const value = tokens.default[key];
          const actualValue = tokens.base[value];
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
