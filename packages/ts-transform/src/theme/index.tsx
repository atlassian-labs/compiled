import * as ts from 'typescript';
import { isPackageModuleImport } from '../utils/ast-node';
import { visitCreateThemeProvider } from './visitors/visit-create-theme-provider';
import { visitSourceFileEnsureDefaultReactImport } from '../utils/visit-source-file-ensure-default-react-import';
import { visitSourceFileEnsureStyleImport } from '../utils/visit-source-file-ensure-style-import';
import {
  TOKENS_OBJECT_NAME,
  CREATE_THEME_PROVIDER_IMPORT,
  COMPILED_THEME_NAME,
  BASE_TOKENS,
} from '../constants';
import { TransformerOptions, Tokens } from '../types';
import { getTokenCssVariable } from '../utils/theme';

const isStyledImportFound = (sourceFile: ts.SourceFile): boolean => {
  return !!sourceFile.statements.find(statement =>
    isPackageModuleImport(statement, CREATE_THEME_PROVIDER_IMPORT)
  );
};

const isCreateThemeProviderCall = (node: ts.Node): node is ts.CallExpression => {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === CREATE_THEME_PROVIDER_IMPORT
  );
};

const buildTokensObject = (tokens: Tokens, tokenPrefix?: string) => {
  const themes = Object.keys(tokens).filter(themeName => themeName !== BASE_TOKENS);

  return ts.createObjectLiteral(
    themes.map(name => {
      const themeTokens = Object.entries(tokens[name]).map(([key, value]) => ({
        key: getTokenCssVariable(key, tokenPrefix),
        value: tokens.base[value],
      }));

      return ts.createPropertyAssignment(
        ts.createIdentifier(name),
        ts.createObjectLiteral(
          themeTokens.map(themeToken =>
            ts.createPropertyAssignment(
              ts.createIdentifier(themeToken.key),
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

export default function styledComponentTransformer(
  _: ts.Program,
  options: TransformerOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
    return sourceFile => {
      if (!isStyledImportFound(sourceFile)) {
        return sourceFile;
      }

      if (!options.tokens) {
        throw new Error('define your tokens');
      }

      const tokens = options.tokens;
      let tokensAdded = false;

      const transformedSourceFile = visitSourceFileEnsureDefaultReactImport(
        visitSourceFileEnsureStyleImport(sourceFile, context, {
          removeNamedImport: CREATE_THEME_PROVIDER_IMPORT,
          imports: [COMPILED_THEME_NAME],
        }),
        context
      );

      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        if ((tokensAdded && ts.isVariableStatement(node)) || ts.isExpressionStatement(node)) {
          tokensAdded = true;
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

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
