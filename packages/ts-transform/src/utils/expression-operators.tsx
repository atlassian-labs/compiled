import * as ts from 'typescript';

interface JoinStringLiteralExpressionOpts {
  operator?: ts.BinaryOperator | ts.BinaryOperatorToken;
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
 * conditional = false {left + ' ' + right}
 * conditional = true {right ? left + ' ' + right : left}
 */
export function joinToJsxExpression(
  left: ts.Expression,
  right: ts.Expression,
  { conditional = false }: JoinStringLiteralExpressionOpts = {}
): ts.JsxExpression {
  if (conditional) {
    return ts.createJsxExpression(
      undefined,
      ts.createBinary(left, ts.SyntaxKind.PlusToken, createConditionalExpression(right))
    );
  }

  return ts.createJsxExpression(
    undefined,
    ts.createBinary(
      ts.createBinary(left, ts.SyntaxKind.PlusToken, ts.createStringLiteral(' ')),
      ts.SyntaxKind.PlusToken,
      right
    )
  );
}

export const shortCircuitToEmptyString = (left: ts.Expression): ts.BinaryExpression => {
  return ts.createBinary(
    left,
    ts.createToken(ts.SyntaxKind.BarBarToken),
    ts.createStringLiteral('')
  );
};

/**
 * left + right
 */
export const joinToBinaryExpression = (
  left: ts.Expression,
  right: ts.Expression
): ts.BinaryExpression => {
  return ts.createBinary(left, ts.createToken(ts.SyntaxKind.PlusToken), right);
};

/**
 * left + middle + right
 */
export const joinThreeExpressions = (
  left: ts.Expression,
  middle: ts.Expression,
  right: ts.Expression
): ts.BinaryExpression => {
  return joinToBinaryExpression(joinToBinaryExpression(left, middle), right);
};
