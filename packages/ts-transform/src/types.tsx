import * as ts from 'typescript';

export interface CssVariableExpressions {
  /**
   * Name of the css variable e.g. "--my-css-variable"
   */
  name: string;

  /**
   * Identifier of the css variable, as in the literal ts.Identifier.
   */
  expression: ts.Identifier | ts.BinaryExpression | ts.Expression;
}

export interface Declarations {
  [moduleName: string]: ts.VariableDeclaration | ts.FunctionDeclaration | ts.BindingElement;
}

export interface ToCssReturnType {
  css: string;
  cssVariables: CssVariableExpressions[];
}

export interface TransformerOptions {
  nonce?: string;
  debug?: boolean;
  sourceMap?: boolean;
  minify?: boolean;
  tokenPrefix?: string;
  tokens?: {
    // This is the "base" tokens that shouldn't be directly referenced outside of the tokens object itself.
    // Need to confirm name!!
    base: { [key: string]: any };

    // These is the default "theme".
    default: { [key: string]: any };

    // Other "themes".
    [key: string]: { [key: string]: any };
  };
}
