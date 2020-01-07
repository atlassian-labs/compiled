import * as ts from 'typescript';

interface JoinStringLiteralExpressionOpts {
  operator?: ts.BinaryOperator | ts.BinaryOperatorToken;
  /**
   * Will join them conditionally:
   * prepend + subject ? ' ' + subject : ''
   */
  conditional?: boolean;
}

const createConditionalExpression = (subject: ts.Expression) => {
  return ts.createConditional(
    subject,
    ts.createBinary(ts.createStringLiteral(' '), ts.createToken(ts.SyntaxKind.PlusToken), subject),
    ts.createStringLiteral('')
  );
};

/**
 * Joins two expressions to a jsx expression, separated by an operator and a space
 * Example: 'myString' + ' ' + myFunction()
 */
export function joinStringLiteralExpression(
  prepend: ts.Expression,
  subject: ts.Expression,
  { operator = ts.SyntaxKind.PlusToken, conditional = false }: JoinStringLiteralExpressionOpts = {}
) {
  if (conditional) {
    return ts.createJsxExpression(
      undefined,
      ts.createBinary(prepend, operator, createConditionalExpression(subject))
    );
  }

  return ts.createJsxExpression(
    undefined,
    ts.createBinary(
      ts.createBinary(prepend, operator, ts.createStringLiteral(' ')),
      operator,
      subject
    )
  );
}
