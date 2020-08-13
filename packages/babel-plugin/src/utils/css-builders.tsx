import * as t from '@babel/types';
import generate from '@babel/generator';
import { addUnitIfNeeded, cssAfterInterpolation, cssBeforeInterpolation } from '@compiled/css';
import { kebabCase, hash } from '@compiled/utils';
import { joinExpressions } from './ast-builders';
import { State } from '../types';

export interface CSSOutput {
  css: string;
  variables: {
    name: string;
    expression: t.Expression;
  }[];
}

/**
 * Will look in an expression and return the actual value.
 * If the expression is an identifier node (a variable) and a constant,
 * it will return the variable reference.
 *
 * E.g: If there was a identifier called `color` that is set somewhere as `const color = 'blue'`,
 * passing the `color` identifier to this function would return `'blue'`.
 *
 * This behaviour is the same for const string & numeric literals,
 * and object expressions.
 *
 * @param expression Expression we want to interrogate.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
const getInterpolation = <TNode extends {}>(expression: TNode | undefined, state: State) => {
  if (t.isIdentifier(expression) && state.declarations) {
    const declaration = state.declarations[expression.name];
    if (t.isVariableDeclaration(declaration) && declaration.kind === 'const') {
      const potentialValue = declaration.declarations[0].init;
      if (
        t.isStringLiteral(potentialValue) ||
        t.isNumericLiteral(potentialValue) ||
        t.isObjectExpression(potentialValue)
      ) {
        return potentialValue;
      }
    }
  }

  return expression;
};

/**
 * Will normalize the value of a `content` CSS property to ensure it has quotations around it.
 * This is done to replicate both how Styled Components behaves,
 * while not breaking how Emotion handles it.
 */
const normalizeContentValue = (value: string) => {
  if (value.charAt(0) !== '"' && value.charAt(0) !== "'") {
    return `"${value}"`;
  }

  return value;
};

const extractKey = (node: t.Expression) => {
  if (t.isIdentifier(node)) {
    return node.name;
  }

  if (t.isStringLiteral(node)) {
    return node.value;
  }

  throw new Error('not supported');
};

/**
 * Extracts CSS data from an object expression node.
 *
 * @param node Node we're interested in extracting CSS from.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
const extractObjectExpression = (node: t.ObjectExpression, state: State): CSSOutput => {
  let variables: CSSOutput['variables'] = [];
  let css = '';

  node.properties.forEach((prop) => {
    if (t.isObjectProperty(prop)) {
      // Don't use prop.value directly as it extracts constants from identifiers if needed.
      const propValue = getInterpolation(prop.value, state);
      const key = extractKey(prop.key);
      let value = '';

      if (t.isStringLiteral(propValue)) {
        // We've found a string literal like: `color: 'blue'`
        value = key === 'content' ? normalizeContentValue(propValue.value) : propValue.value;
      } else if (t.isNumericLiteral(propValue)) {
        // We've found a numeric literal like: `fontSize: 12`
        value = addUnitIfNeeded(key, propValue.value);
      } else if (t.isObjectExpression(propValue)) {
        // We've found a nested object like: `':hover': { color: 'red' }`
        const result = extractObjectExpression(propValue, state);
        css += `${key} { ${result.css} }`;
        variables = variables.concat(result.variables);
        return;
      } else if (t.isTemplateLiteral(propValue)) {
        // We've found a template literal like: `fontSize: `${fontSize}px`
        // -----
        // Both functions (extractTemplateLiteral + extractObjectExpression) reference each other.
        // One needs to disable this warning.
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const result = extractTemplateLiteral(propValue, state);
        value = result.css;
        variables = variables.concat(result.variables);
      } else if (t.isExpression(propValue)) {
        // This is the catch all for any kind of expression.
        // We don't want to explicitly handle each expression node differently if we can avoid it!
        const variableName = `--var-${hash(generate(propValue).code)}`;
        variables.push({ name: variableName, expression: propValue });
        value = `var(${variableName})`;
      } else {
        throw new Error(`Not supported.`);
      }

      // Time to add this key+value to the CSS string we're building up.
      css += `${kebabCase(key)}: ${value};`;
    } else if (t.isSpreadElement(prop) && t.isIdentifier(prop.argument)) {
      // We found a object spread such as: `...mixinIdentifier`.
      const declaration = (state.declarations || {})[prop.argument.name];
      if (
        t.isVariableDeclaration(declaration) &&
        t.isObjectExpression(declaration.declarations[0].init)
      ) {
        const declarationValue = declaration.declarations[0].init;
        const result = extractObjectExpression(declarationValue, state);
        css += result.css;
        variables = variables.concat(result.variables);
        return;
      } else {
        throw new Error(`Declaration for ${prop.argument.name} could not be found.`);
      }
    }
  });

  return { css, variables };
};

/**
 * Extracts CSS data from a template literal node.
 *
 * @param node Node we're interested in extracting CSS from.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
const extractTemplateLiteral = (node: t.TemplateLiteral, state: State): CSSOutput => {
  let variables: CSSOutput['variables'] = [];
  // quasis are the string pieces of the template literal - the parts around the interpolations.
  const css = node.quasis.reduce((css, q, index) => {
    const interpolation = getInterpolation(node.expressions[index], state);

    if (t.isStringLiteral(interpolation) || t.isNumericLiteral(interpolation)) {
      // Simple case - we can immediately inline the value.
      return css + q.value.raw + interpolation.value;
    }

    if (t.isObjectExpression(interpolation)) {
      // We found an object like: css`${{ red: 'blue' }}`.
      const result = extractObjectExpression(interpolation, state);
      variables = variables.concat(result.variables);
      return css + result.css;
    }

    if (interpolation) {
      // Everything else is considered a catch all expression.
      // The only difficulty here is what we do around prefixes and suffixes.
      // CSS variables can't have them! So we need to move them to the inline style.
      // E.g. `font-size: ${fontSize}px` will end up needing to look like:
      // `font-size: var(--var-font-size)`, with the suffix moved to inline styles
      // style={{ '--var-font-size': fontSize + 'px' }}
      const variableName = `--var-${hash(generate(interpolation).code)}`;
      const nextQuasis = node.quasis[index + 1];
      const before = cssBeforeInterpolation(css + q.value.raw);
      const after = cssAfterInterpolation(nextQuasis.value.raw);

      let expression: t.Expression =
        before.variablePrefix || after.variableSuffix
          ? // When there is a prefix or suffix we want to ensure the interpolation at least
            // resolves to an empty string - so we short circuit it to one.
            t.logicalExpression('||', interpolation, t.stringLiteral(''))
          : interpolation;

      if (before.variablePrefix) {
        // A prefix is defined - we want to add them together!
        // E.g: prefix + expression
        expression = joinExpressions(t.stringLiteral(before.variablePrefix), expression, null);
      }

      if (after.variableSuffix) {
        // A suffix is defined - we want to add it to the whatever has been defined as the expression.
        // E.g: expression + suffix
        expression = joinExpressions(expression, t.stringLiteral(after.variableSuffix), null);
      }

      nextQuasis.value.raw = after.css; // Removes any suffixes from the next quasis.
      variables.push({ name: variableName, expression });

      return before.css + `var(${variableName})`;
    }

    return css + q.value.raw;
  }, '');

  return { css, variables };
};

/**
 * Will return a CSS string and CSS variables array from an input node.
 *
 * @param node Node we're interested in extracting CSS from.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
export const buildCss = (node: t.Expression, state: State): CSSOutput => {
  if (t.isStringLiteral(node)) {
    return { css: node.value, variables: [] };
  }

  if (t.isTemplateLiteral(node)) {
    return extractTemplateLiteral(node, state);
  }

  if (t.isObjectExpression(node)) {
    return extractObjectExpression(node, state);
  }

  throw new Error('Unsupported node.');
};
