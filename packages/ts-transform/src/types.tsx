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
  [moduleName: string]: ts.VariableDeclaration | ts.FunctionDeclaration;
}

export interface ToCssReturnType {
  css: string;
  cssVariables: CssVariableExpressions[];
}

export interface TransformerOptions {
  nonce?: string;
  debug?: boolean;
  sourceMap?: boolean;
}
