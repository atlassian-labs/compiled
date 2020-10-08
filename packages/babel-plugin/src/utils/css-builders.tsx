import * as t from '@babel/types';
import generate from '@babel/generator';
import { addUnitIfNeeded, cssAfterInterpolation, cssBeforeInterpolation } from '@compiled/css';
import { kebabCase, hash } from '@compiled/utils';
import { joinExpressions } from './ast-builders';
import { Metadata } from '../types';
import { getKey, resolveBindingNode, buildCodeFrameError } from './ast';
import { evaluateExpression } from './evaluate-expression';

export interface CSSOutput {
  css: string;
  variables: {
    name: string;
    expression: t.Expression;
  }[];
}

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

/**
 * Extracts CSS data from an object expression node.
 *
 * @param node Node we're interested in extracting CSS from.
 * @param state Babel state - should house options and meta data used during the transformation.
 */
const extractObjectExpression = (node: t.ObjectExpression, meta: Metadata): CSSOutput => {
  let variables: CSSOutput['variables'] = [];
  let css = '';

  node.properties.forEach((prop) => {
    if (t.isObjectProperty(prop)) {
      // Don't use prop.value directly as it extracts constants from identifiers if needed.
      const { value: propValue, meta: updatedMeta } = evaluateExpression(
        prop.value as t.Expression,
        meta
      );

      const key = getKey(prop.key);
      let value = '';

      if (t.isStringLiteral(propValue)) {
        // We've found a string literal like: `color: 'blue'`
        value = key === 'content' ? normalizeContentValue(propValue.value) : propValue.value;
      } else if (t.isNumericLiteral(propValue)) {
        // We've found a numeric literal like: `fontSize: 12`
        value = addUnitIfNeeded(key, propValue.value);
      } else if (t.isObjectExpression(propValue)) {
        // We've found a nested object like: `':hover': { color: 'red' }`
        const result = extractObjectExpression(propValue, updatedMeta);
        css += `${key} { ${result.css} }`;
        variables = variables.concat(result.variables);
        return;
      } else if (t.isTemplateLiteral(propValue)) {
        // We've found a template literal like: `fontSize: `${fontSize}px`
        // -----
        // Both functions (extractTemplateLiteral + extractObjectExpression) reference each other.
        // One needs to disable this warning.
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const result = extractTemplateLiteral(propValue, updatedMeta);
        value = result.css;
        variables = variables.concat(result.variables);
      } else {
        // This is the catch all for any kind of expression.
        // We don't want to explicitly handle each expression node differently if we can avoid it!
        const variableName = `--var-${hash(generate(propValue).code)}`;
        variables.push({ name: variableName, expression: propValue });
        value = `var(${variableName})`;
      }

      // Time to add this key+value to the CSS string we're building up.
      css += `${kebabCase(key)}: ${value};`;
    } else if (t.isSpreadElement(prop)) {
      let resolvedBinding = undefined;

      if (t.isIdentifier(prop.argument)) {
        resolvedBinding = resolveBindingNode(prop.argument.name, meta);

        if (!resolvedBinding) {
          throw buildCodeFrameError('Variable could not be found', prop.argument, meta.parentPath);
        }
      }

      const { value: propValue, meta: updatedMeta } = evaluateExpression(prop.argument, meta);

      if (t.isObjectExpression(propValue)) {
        const result = extractObjectExpression(propValue, updatedMeta);

        if (resolvedBinding?.source === 'import' && result.variables.length > 0) {
          // NOTE: Currently we throw if the found CSS has any variables found from an
          // import. This is because we'd need to ensure all identifiers are added to
          // the owning file - if not done they would just error at runtime. Because
          // this isn't a required feature at the moment we're deprioritizing support
          // for this.
          throw buildCodeFrameError(
            "Identifier contains values that can't be statically evaluated",
            prop.argument,
            meta.parentPath
          );
        }

        css += result.css;
        variables = variables.concat(result.variables);
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
const extractTemplateLiteral = (node: t.TemplateLiteral, meta: Metadata): CSSOutput => {
  let variables: CSSOutput['variables'] = [];
  // quasis are the string pieces of the template literal - the parts around the interpolations.
  const css = node.quasis.reduce((css, q, index) => {
    const nodeExpression = node.expressions[index];
    const { value: interpolation, meta: updatedMeta } = evaluateExpression(nodeExpression, meta);

    if (t.isStringLiteral(interpolation) || t.isNumericLiteral(interpolation)) {
      // Simple case - we can immediately inline the value.
      return css + q.value.raw + interpolation.value;
    }

    if (t.isObjectExpression(interpolation)) {
      // We found an object like: css`${{ red: 'blue' }}`.
      const result = extractObjectExpression(interpolation, updatedMeta);
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
export const buildCss = (node: t.Expression, meta: Metadata): CSSOutput => {
  if (t.isStringLiteral(node)) {
    return { css: node.value, variables: [] };
  }

  if (t.isTemplateLiteral(node)) {
    return extractTemplateLiteral(node, meta);
  }

  if (t.isObjectExpression(node)) {
    return extractObjectExpression(node, meta);
  }

  if (t.isIdentifier(node)) {
    const resolvedBinding = resolveBindingNode(node.name, meta);

    if (!resolvedBinding) {
      throw buildCodeFrameError('Variable could not be found', node, meta.parentPath);
    }

    if (!t.isExpression(resolvedBinding.node)) {
      throw buildCodeFrameError(
        `${resolvedBinding.node.type} isn't a supported CSS type - try using an object or string`,
        node,
        meta.parentPath
      );
    }

    const result = buildCss(resolvedBinding.node, resolvedBinding.meta);

    if (resolvedBinding.source === 'import' && result.variables.length > 0) {
      // NOTE: Currently we throw if the found CSS has any variables found from an
      // import. This is because we'd need to ensure all identifiers are added to
      // the owning file - if not done they would just error at runtime. Because
      // this isn't a required feature at the moment we're deprioritizing support
      // for this.
      throw buildCodeFrameError(
        "Identifier contains values that can't be statically evaluated",
        node,
        meta.parentPath
      );
    }

    return result;
  }

  if (t.isArrayExpression(node)) {
    let css = '';
    let variables: CSSOutput['variables'] = [];

    node.elements.forEach((element) => {
      if (!t.isExpression(element)) {
        throw buildCodeFrameError(
          `${element && element.type} isn't a supported CSS type - try using an object or string`,
          node,
          meta.parentPath
        );
      }

      const result = buildCss(element, meta);
      css += result.css;
      variables = variables.concat(result.variables);
    });

    return {
      css,
      variables,
    };
  }

  throw buildCodeFrameError(
    `${node.type} isn't a supported CSS type - try using an object or string`,
    node,
    meta.parentPath
  );
};
