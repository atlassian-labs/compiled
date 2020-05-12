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

export interface AnyTokens {
  [key: string]: string | number | AnyTokens;
}

export interface Tokens {
  // This is the "base" tokens that shouldn't be directly referenced outside of the tokens object itself.
  // Need to confirm name!!
  base: {
    [key: string]: string | number;
  };

  // These is the default "theme" (usually will be light mode).
  default: AnyTokens;

  // Other "themes".
  [key: string]: AnyTokens;
}

export interface RootTransformerOptions {
  nonce?: string;
  debug?: boolean;
  sourceMap?: boolean;
  minify?: boolean;
  strict?: boolean;
  tokenPrefix?: string;
  tokens?: Tokens | string;
}

export interface TransformerOptions extends Omit<RootTransformerOptions, 'tokens'> {
  tokens?: Tokens;
}
