import * as ts from 'typescript';
import {
  visitCreateThemeProvider,
  isCreateThemeProviderCall,
  isCreateThemeProviderFound,
} from './visitors/visit-create-theme-provider';
import {
  isCreateVariantsCall,
  isCreateVariantsFound,
  visitCreateVariants,
} from './visitors/visit-create-variants';
import { visitSourceFileEnsureDefaultReactImport } from '../utils/visit-source-file-ensure-default-react-import';
import { visitSourceFileEnsureStyleImport } from '../utils/visit-source-file-ensure-style-import';
import {
  TOKENS_OBJECT_NAME,
  CREATE_THEME_PROVIDER_IMPORT,
  COMPILED_THEME_NAME,
  BASE_TOKENS,
  CREATE_VARIANTS_IMPORT,
  USE_MODE_NAME,
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

export default function styledComponentTransformer(
  _: ts.Program,
  options: TransformerOptions = {}
): ts.TransformerFactory<ts.SourceFile> {
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (sourceFile) => {
      const isThemeProviderFound = isCreateThemeProviderFound(sourceFile);
      const isVariantsFound = isCreateVariantsFound(sourceFile);
      if (!isThemeProviderFound && !isVariantsFound) {
        return sourceFile;
      }

      if (!options.tokens) {
        throw new Error('define your tokens');
      }

      const tokens = options.tokens;
      let tokensAdded = false;

      const transformedSourceFile = visitSourceFileEnsureDefaultReactImport(
        visitSourceFileEnsureStyleImport(sourceFile, context, {
          removeNamedImport: isThemeProviderFound
            ? CREATE_THEME_PROVIDER_IMPORT
            : CREATE_VARIANTS_IMPORT,
          imports: [isThemeProviderFound ? COMPILED_THEME_NAME : USE_MODE_NAME],
        }),
        context
      );

      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        if (
          (isThemeProviderFound && tokensAdded && ts.isVariableStatement(node)) ||
          ts.isExpressionStatement(node)
        ) {
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

        if (
          (isThemeProviderFound && tokensAdded && ts.isVariableStatement(node)) ||
          ts.isExpressionStatement(node)
        ) {
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

        if (
          isVariantsFound &&
          ts.isVariableStatement(node) &&
          node.declarationList.declarations[0] &&
          node.declarationList.declarations[0].initializer &&
          isCreateVariantsCall(node.declarationList.declarations[0].initializer)
        ) {
          let gottem: ts.Node;

          const createVariantsStatementVisitor = (innerNode: ts.Node): ts.Node => {
            if (isCreateVariantsCall(innerNode)) {
              gottem = innerNode.arguments[0];
              return visitCreateVariants(innerNode, context, options);
            }

            return ts.visitEachChild(innerNode, createVariantsStatementVisitor, context);
          };

          const transformedCreateVariants = ts.visitEachChild(
            node,
            createVariantsStatementVisitor,
            context
          );

          // @ts-ignore
          return [gottem, transformedCreateVariants];
        }

        if (isThemeProviderFound && isCreateThemeProviderCall(node)) {
          return visitCreateThemeProvider(node, context, options);
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(transformedSourceFile, visitor);
    };
  };

  return transformerFactory;
}
