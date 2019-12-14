import * as ts from 'typescript';

export interface CssVariableExpressions {
  name: string;
  expression: ts.Expression;
}

export interface VariableDeclarations {
  [moduleName: string]: ts.VariableDeclaration;
}
