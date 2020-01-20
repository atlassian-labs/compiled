import * as ts from 'typescript';

interface JoinStringLiteralExpressionOpts {
  operator?: ts.BinaryOperator | ts.BinaryOperatorToken;
  /**
   * Will join them conditionally:
   * left + right ? ' ' + right : ''
   */
  conditional?: boolean;
}

const createConditionalExpression = (right: ts.Expression) => {
  return ts.createConditional(
    right,
    ts.createBinary(ts.createStringLiteral(' '), ts.createToken(ts.SyntaxKind.PlusToken), right),
    ts.createStringLiteral('')
  );
};

/**
 * Joins two expressions to a jsx expression, separated by an operator and a space
 * Example: 'myString' + ' ' + myFunction()
 */
export function joinToJsxExpression(
  left: ts.Expression,
  right: ts.Expression,
  { operator = ts.SyntaxKind.PlusToken, conditional = false }: JoinStringLiteralExpressionOpts = {}
): ts.JsxExpression {
  if (conditional) {
    return ts.createJsxExpression(
      undefined,
      ts.createBinary(left, operator, createConditionalExpression(right))
    );
  }

  return ts.createJsxExpression(
    undefined,
    ts.createBinary(ts.createBinary(left, operator, ts.createStringLiteral(' ')), operator, right)
  );
}

export const joinToBinaryExpression = (
  left: ts.Expression,
  right: ts.Expression
): ts.BinaryExpression => {
  return ts.createBinary(left, ts.createToken(ts.SyntaxKind.PlusToken), right);
};
