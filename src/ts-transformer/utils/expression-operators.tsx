import * as ts from 'typescript';

/**
 * Joins two expressions to a jsx expression, separated by an operator and a space
 * Example: 'myString' + ' ' + myFunction()
 */
export function joinStringLiteralExpression(
  prepend: ts.Expression,
  subject: ts.Expression,
  operator: ts.BinaryOperator | ts.BinaryOperatorToken = ts.SyntaxKind.PlusToken
) {
  return ts.createJsxExpression(
    undefined,
    ts.createBinary(
      ts.createBinary(prepend, operator, ts.createStringLiteral(' ')),
      operator,
      subject
    )
  );
}
