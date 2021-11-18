import generate from '@babel/generator';
import type * as t from '@babel/types';

import type { Metadata } from '../types';
import { buildCss } from '../utils/css-builders';
import {
  isCompiledCSSCallExpression,
  isCompiledCSSTaggedTemplateExpression,
} from '../utils/is-compiled';
import type { CSSOutput } from '../utils/types';

export const getCss = (
  expression: t.Expression | t.JSXEmptyExpression | t.SpreadElement,
  meta: Metadata
): CSSOutput => {
  // TODO StringLiteral | LogicalExpression | MemberExpression | ObjectExpression | TaggedTemplateExpression | TemplateLiteral;
  if (expression.type === 'Identifier') {
    return {
      css: [
        {
          type: 'reference',
          reference: expression.name,
        },
      ],
      variables: [],
    };
  } else if (expression.type === 'ObjectExpression') {
    return buildCss(expression, meta);
  } else if (expression.type === 'ArrayExpression') {
    const output: CSSOutput = {
      css: [],
      variables: [],
    };

    for (const element of expression.elements) {
      if (element) {
        const x = getCss(element, meta);
        output.css.push(...x.css);
        output.variables.push(...x.variables);
      }
    }

    return output;
  } else if (isCompiledCSSCallExpression(expression, meta.state)) {
    // We have found an inlined css call expression
    return buildCss(expression.arguments[0] as any, meta);
  } else if (isCompiledCSSTaggedTemplateExpression(expression, meta.state)) {
    // We have found an inlined css tagged template expression
    return buildCss(expression.quasi as any, meta);
    // @ts-ignore
  } else if (expression.type === 'CallExpression') {
    // Assume the call expression references a compiled css mixin
    return {
      css: [
        {
          type: 'reference',
          reference: generate(expression).code,
        },
      ],
      variables: [],
    };
  } else if (expression.type === 'ConditionalExpression') {
    const alternateCss = getCss(expression.alternate, meta);
    const consequentCss = getCss(expression.consequent, meta);

    // TODO
    return {
      css: [
        {
          type: 'conditional',
          alternate: alternateCss.css[0],
          consequent: consequentCss.css[0],
          test: expression.test,
        },
      ],
      variables: [...alternateCss.variables, ...consequentCss.variables],
    };
  }

  throw new Error(`Unexpected expression type ${expression.type}`);
};
