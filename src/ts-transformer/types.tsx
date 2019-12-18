import * as ts from 'typescript';

export interface CssVariableExpressions {
  /**
   * Name of the css variable e.g. "--my-css-variable"
   */
  name: string;

  /**
   * Identifier of the css variable, as in the literal ts.Identifier.
   */
  identifier: ts.Identifier;
}

export interface VariableDeclarations {
  [moduleName: string]: ts.VariableDeclaration;
}

export interface ToCssReturnType {
  css: string;
  cssVariables: CssVariableExpressions[];
}
