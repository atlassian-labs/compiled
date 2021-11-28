import * as t from '@babel/types';
import { unique } from '@compiled/utils';

import type { Variable } from './types';

/**
 * Will build up the CSS variables prop to be placed as inline styles.
 *
 * @param variables CSS variables that will be placed in the AST
 * @param transform Transform function that can be used to change the CSS variable expression
 */
export const buildCssVariables = (
  variables: Variable[],
  transform = (expression: t.Expression) => expression
): t.ObjectProperty[] => {
  return unique(
    // Make sure all defined CSS variables are unique
    variables,
    // We consider their uniqueness based on their name
    (variable: Variable) => variable.name
  ).map((variable: Variable) => {
    // Map them into object properties.
    return t.objectProperty(
      t.stringLiteral(variable.name),
      t.callExpression(
        t.identifier('ix'),
        [
          // Allow callers to transform the expression if needed,
          // for example the styled API strips away the arrow function.
          transform(variable.expression),
          (variable.suffix && t.stringLiteral(variable.suffix)) as t.Expression,
          (variable.suffix && variable.prefix && t.stringLiteral(variable.prefix)) as t.Expression,
        ].filter(Boolean)
      )
    );
  });
};
