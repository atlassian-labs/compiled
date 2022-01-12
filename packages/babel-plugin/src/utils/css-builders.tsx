import generate from '@babel/generator';
import * as t from '@babel/types';
import { addUnitIfNeeded, cssAffixInterpolation } from '@compiled/css';
import { hash, kebabCase } from '@compiled/utils';

import type { Metadata } from '../types';

import { buildCodeFrameError, getKey } from './ast';
import { evaluateExpression } from './evaluate-expression';
import {
  isCompiledCSSCallExpression,
  isCompiledCSSTaggedTemplateExpression,
  isCompiledKeyframesCallExpression,
  isCompiledKeyframesTaggedTemplateExpression,
} from './is-compiled';
import { resolveBinding } from './resolve-binding';
import type {
  CSSOutput,
  CssItem,
  LogicalCssItem,
  SheetCssItem,
  PartialBindingWithMeta,
} from './types';

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
 * Will merge all subsequent unconditional CSS expressions together.
 *
 * Input
 *
 * ```
 * [l, u, u, l, u, s, u, u, u, l, u]
 * ```
 *
 * Output
 *
 * ```
 * [s, l, uu, l, uuuu, l, u]
 * ```
 *
 * Where: `l` is a logical item,
 *        `u` is a unconditional item,
 *        `s` is a sheet
 *
 * @param arr
 */
const mergeSubsequentUnconditionalCssItems = (arr: CssItem[]): CssItem[] => {
  const items: Exclude<CssItem, SheetCssItem>[] = [];
  const sheets: SheetCssItem[] = [];

  for (let index = 0; index < arr.length; index++) {
    const item = arr[index];

    if (item.type === 'sheet') {
      sheets.push(item);
      continue;
    }

    if (item.type === 'unconditional') {
      // We found an unconditional. Let's iterate further and merge all subsequent ones.

      for (let subsequentIndex = index + 1; subsequentIndex < arr.length; subsequentIndex++) {
        const subsequentItem = arr[subsequentIndex];
        if (subsequentItem.type === 'unconditional') {
          item.css += subsequentItem.css;
        } else if (subsequentItem.type === 'sheet') {
          sheets.push(subsequentItem);
        } else {
          break;
        }

        // Update index back to the new one which we'll start from again.
        index = subsequentIndex;
      }
    }

    items.push(item);
  }

  return [...sheets, ...items];
};

/**
 * Returns the item css.
 *
 * @param item
 */
export const getItemCss = (item: CssItem): string => {
  return item.type === 'conditional'
    ? [item.consequent, item.alternate].map(getItemCss).join('')
    : item.css;
};

/**
 * Returns the logical item from a conditional expression.
 *
 * @param css
 * @param node
 * @param type
 */
const getLogicalItemFromConditionalExpression = (
  css: CSSOutput['css'],
  node: t.ConditionalExpression,
  type: string
) => {
  const expression = node.test;
  return css.map((item) => {
    if (item.type === 'conditional') {
      return item;
    }

    if (item.type === 'logical') {
      return {
        ...item,
        expression: t.logicalExpression(item.operator, expression, item.expression),
      };
    }

    /**
     * Ensure that the CSS declarations in the alternate mixin are not evaluated as
     * unconditional rules.
     * Eg ${(props) => (props.isPrimary ? primary : secondary)}; where primary is
     * the consequent node and secondary is the alternate node
     * -> primary mixin will be applied only when props.isPrimary
     * -> secondary mixin will be applied only when !props.isPrimary
     *  */
    const alternateExpression = t.unaryExpression('!', expression);

    const logicalItem: LogicalCssItem = {
      type: 'logical',
      css: getItemCss(item),
      expression: type === 'consequent' ? expression : alternateExpression,
      operator: '&&',
    };

    return logicalItem;
  });
};

/**
 * Recursive helper function for toCSSRule to handle conditional CssItems
 *
 * @param selector
 * @param item
 */
const toCSSRuleInternal = (selector: string, item: CssItem): CssItem =>
  item.type === 'conditional'
    ? {
        ...item,
        consequent: toCSSRuleInternal(selector, item.consequent),
        alternate: toCSSRuleInternal(selector, item.alternate),
      }
    : { ...item, css: `${selector} { ${getItemCss(item)} }` };

/**
 * Maps the css in the result to CSS rules.
 *
 * @param selector
 * @param result
 */
const toCSSRule = (selector: string, result: CSSOutput) => ({
  ...result,
  css: result.css.map((item): CssItem => toCSSRuleInternal(selector, item)),
});

/**
 * Recursive helper function for toCSSDeclaration to handle conditional CssItems
 *
 * @param key
 * @param items
 */
const toCSSDeclarationInternal = (key: string, item: CssItem): CssItem => {
  if (item.type === 'sheet') {
    // Leave sheets as is
    return item;
  } else if (item.type === 'conditional') {
    // Handle conditional branches
    return {
      ...item,
      consequent: toCSSDeclarationInternal(key, item.consequent),
      alternate: toCSSDeclarationInternal(key, item.alternate),
    };
  } else {
    return { ...item, css: `${kebabCase(key)}: ${getItemCss(item)};` };
  }
};

/**
 * Maps the css in the result to CSS declarations.
 *
 * @param key
 * @param result
 */
const toCSSDeclaration = (key: string, result: CSSOutput) => ({
  ...result,
  css: result.css.map((item): CssItem => toCSSDeclarationInternal(key, item)),
});

/**
 * Will return the variable declarator value node from meta's own path.
 * It will compare the variable declarator node id's name with passed node name and
 * returns its stringified value along with the node.
 *
 * Eg.
 * 1. If passed node is an Identifier with name `abcd` and somewhere in own path
 * we have any variable declarator `const abcd = obj.value`, it will return
 * stringified `obj.value` along with node `obj.value`.
 * Input: `node: const abcd = obj.value`
 * Output: `{ variableName: 'obj.value', expression: Expression // obj.value Expression  }`

 * 2. If variable declarator's value is undefined `const abcd = undefined`, it will
 * return stringified `abcd` along with undefined.
 * Input: `node: const abcd = undefined`
 * Output: `{ variableName: 'abcd', expression: undefined  }`
 *
 * @param node
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
const getVariableDeclaratorValueForOwnPath = (node: t.Expression, meta: Metadata) => {
  // Will give stringified code for the node. If node is a function it will stringified 'function(){}'
  let expression = node;
  let variableName = generate(node).code;

  // Traverse variable declarator. If its value is not undefined/null return it along with
  // its stringified value otherwise return undefined/null along with stringified
  // variable name.
  meta.ownPath?.traverse({
    VariableDeclarator(path) {
      if (t.isIdentifier(node) && t.isIdentifier(path.node.id, { name: node.name })) {
        const { init } = path.node;

        expression = init as t.Expression;

        if (meta.context === 'keyframes') {
          // When in the keyframes context, we want to reuse the generated CSS variables as much as possible.
          // We will do this by using the original node, and namespacing it with the keyframe name.
          variableName = `${meta.keyframe}:${node.name}`;
        } else {
          // Get stringified value or original variable name
          variableName = init ? generate(init).code : node.name;
        }

        path.stop();
      }
    },
  });

  return {
    expression,
    variableName,
  };
};

/**
 * Will callback if the filenames from metadata do not match,
 * meaning the next meta imported from another module and was statically evaluated.
 *
 * @param meta {Metadata} The current metadata to use for the comparison
 * @param next {Metadata} The next metadata to use for the comparison
 */
const callbackIfFileIncluded = (meta: Metadata, next: Metadata) => {
  if (meta.state.filename !== next.state.filename) {
    meta.state.includedFiles.push(next.state.file.loc.filename);
  }
};

/**
 * Check if an imported binding resulted in CSS variables after processing.
 *
 * Currently we throw if the found CSS has any variables found from an import
 * This is because we'd need to ensure all identifiers are added to the owning
 * file - if not done they would just error at runtime. Because this isn't a
 * required feature at the moment we're deprioritizing support for this.
 */
const assertNoImportedCssVariables = (
  referenceNode: t.Node,
  meta: Metadata,
  resolvedBinding: PartialBindingWithMeta,
  buildCssResult: CSSOutput
) => {
  if (resolvedBinding.source === 'import' && buildCssResult.variables.length > 0) {
    throw buildCodeFrameError(
      "Identifier contains values that can't be statically evaluated",
      referenceNode,
      meta.parentPath
    );
  }
};

/**
 * Extracts CSS data from a conditional expression node.
 * Eg. props.isPrimary && props.isBolded ? ({ color: 'blue' }) : ({ color: 'red'})
 *
 * @param node Node we're interested in extracting CSS from.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
const extractConditionalExpression = (node: t.ConditionalExpression, meta: Metadata): CSSOutput => {
  const conditionalPaths: ['consequent', 'alternate'] = ['consequent', 'alternate'];
  const css: CSSOutput['css'] = [];
  const variables: CSSOutput['variables'] = [];

  const [consequentCss, alternateCss] = conditionalPaths.map((path) => {
    const pathNode = node[path];
    let cssOutput: CSSOutput | void;

    if (
      t.isObjectExpression(pathNode) ||
      // Check if string or template resembles CSS `property: value`
      (t.isStringLiteral(pathNode) && pathNode.value.includes(':')) ||
      (t.isTemplateLiteral(pathNode) &&
        pathNode.quasis.some((quasi) => quasi.value.raw.includes(':'))) ||
      // CSS tagged templates are already expected to be valid declarations
      isCompiledCSSTaggedTemplateExpression(pathNode, meta.state) ||
      isCompiledCSSCallExpression(pathNode, meta.state)
    ) {
      cssOutput = buildCss(pathNode, meta);
    } else if (t.isIdentifier(pathNode)) {
      const resolved = resolveBinding(pathNode.name, meta);

      if (
        resolved &&
        t.isExpression(resolved.node) &&
        (isCompiledCSSTaggedTemplateExpression(resolved.node, resolved.meta.state) ||
          isCompiledCSSCallExpression(resolved.node, resolved.meta.state))
      ) {
        cssOutput = buildCss(resolved.node, resolved.meta);
        assertNoImportedCssVariables(pathNode, meta, resolved, cssOutput);
      }
    } else if (t.isConditionalExpression(pathNode)) {
      cssOutput = extractConditionalExpression(pathNode, meta);
    }

    if (cssOutput) {
      variables.push(...cssOutput.variables);

      const mergedOutput = mergeSubsequentUnconditionalCssItems(cssOutput.css);
      if (mergedOutput.length > 1) {
        // Each branch should evaluate down to a single logical or unconditional CSS Item.
        throw buildCodeFrameError(
          'Conditional branch contains unexpected expression',
          node,
          meta.parentPath
        );
      }
      return mergedOutput[0];
    }

    return undefined;
  });

  if (consequentCss && alternateCss) {
    css.push({
      type: 'conditional',
      test: node.test,
      consequent: consequentCss,
      alternate: alternateCss,
    });
  } else if (consequentCss) {
    // convert single-sided conditional into logical statements
    css.push(...getLogicalItemFromConditionalExpression([consequentCss], node, 'consequent'));
  } else if (alternateCss) {
    css.push(...getLogicalItemFromConditionalExpression([alternateCss], node, 'alternate'));
  }

  return { css, variables };
};

/**
 * Extracts CSS data from a logical expression node.
 *
 * @param node Node we're interested in extracting CSS from.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
const extractLogicalExpression = (node: t.ArrowFunctionExpression, meta: Metadata): CSSOutput => {
  const variables: CSSOutput['variables'] = [];
  const css: CSSOutput['css'] = [];

  if (t.isExpression(node.body)) {
    const { value: propValue, meta: updatedMeta } = evaluateExpression(node.body, meta);
    const result = buildCss(propValue, updatedMeta);

    callbackIfFileIncluded(meta, updatedMeta);

    css.push(...result.css);
    variables.push(...result.variables);
  }

  return { css: mergeSubsequentUnconditionalCssItems(css), variables };
};

/*
 * Extracts the keyframes CSS from the `@compiled/react` keyframes usage.
 *
 * @param expression {t.CallExpression | t.TaggedTemplateExpression} The keyframes declaration
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 * @returns {CSSOutput} The keyframes CSS
 */
const extractKeyframes = (
  expression: t.CallExpression | t.TaggedTemplateExpression,
  meta: Metadata & { prefix: string; suffix: string }
): CSSOutput => {
  const { prefix, suffix } = meta;

  // Keyframes cannot start with a number, so let's prefix it with a character
  const name = `k${hash(generate(expression).code)}`;
  const selector = `@keyframes ${name}`;
  const { css, variables } = toCSSRule(
    selector,
    buildCss(
      t.isCallExpression(expression) ? (expression.arguments as t.Expression[]) : expression.quasi,
      { ...meta, context: 'keyframes', keyframe: name }
    )
  );

  const unexpectedCss = css.filter((item) => item.type !== 'unconditional');
  if (unexpectedCss.length) {
    throw buildCodeFrameError('Keyframes contains unexpected CSS', expression, meta.parentPath);
  }

  return {
    css: [
      { type: 'sheet', css: css.map((item) => getItemCss(item)).join('') },
      // Use the name of the keyframe instead of the identifier
      { type: 'unconditional', css: prefix + name + suffix },
    ],
    variables,
  };
};

/**
 * Extracts CSS data from an object expression node.
 *
 * @param node Node we're interested in extracting CSS from.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
const extractObjectExpression = (node: t.ObjectExpression, meta: Metadata): CSSOutput => {
  const css: CSSOutput['css'] = [];
  const variables: CSSOutput['variables'] = [];

  node.properties.forEach((prop) => {
    if (t.isObjectProperty(prop)) {
      // Don't use prop.value directly as it extracts constants from identifiers if needed.
      const { value: propValue, meta: updatedMeta } = evaluateExpression(
        prop.value as t.Expression,
        meta
      );

      callbackIfFileIncluded(meta, updatedMeta);

      const key = getKey(prop.computed ? evaluateExpression(prop.key, meta).value : prop.key);
      let value = '';

      if (t.isStringLiteral(propValue)) {
        // We've found a string literal like: `color: 'blue'`
        value = key === 'content' ? normalizeContentValue(propValue.value) : propValue.value;
      } else if (t.isNumericLiteral(propValue)) {
        // We've found a numeric literal like: `fontSize: 12`
        value = addUnitIfNeeded(key, propValue.value);
      } else if (t.isObjectExpression(propValue) || t.isLogicalExpression(propValue)) {
        // We've found either an object like `{}` or a logical expression `isPrimary && {}`.
        // We can handle both the same way as they end up resulting in a CSS rule.
        const result = toCSSRule(key, buildCss(propValue, updatedMeta));
        css.push(...result.css);
        variables.push(...result.variables);
        return;
      } else if (t.isTemplateLiteral(propValue)) {
        // We've found a template literal like: "fontSize: `${fontSize}px`"
        const result = toCSSDeclaration(key, extractTemplateLiteral(propValue, updatedMeta));
        css.push(...result.css);
        variables.push(...result.variables);
        return;
      } else if (
        isCompiledKeyframesCallExpression(propValue, updatedMeta.state) ||
        isCompiledKeyframesTaggedTemplateExpression(propValue, updatedMeta.state)
      ) {
        const result = extractKeyframes(propValue, {
          ...updatedMeta,
          prefix: `${kebabCase(key)}: `,
          suffix: ';',
        });
        css.push(...result.css);
        variables.push(...result.variables);

        return;
      } else {
        const { expression, variableName } = getVariableDeclaratorValueForOwnPath(
          propValue,
          updatedMeta
        );

        // This is the catch all for any kind of expression.
        // We don't want to explicitly handle each expression node differently if we can avoid it!
        const name = `--_${hash(variableName)}`;
        variables.push({
          name,
          expression,
        });

        value = `var(${name})`;
      }

      // Time to add this key+value to the CSS string we're building up.
      css.push({ type: 'unconditional', css: `${kebabCase(key)}: ${value};` });
    } else if (t.isSpreadElement(prop)) {
      let resolvedBinding = undefined;

      if (t.isIdentifier(prop.argument)) {
        resolvedBinding = resolveBinding(prop.argument.name, meta);

        if (!resolvedBinding) {
          throw buildCodeFrameError('Variable could not be found', prop.argument, meta.parentPath);
        }
      }

      const { value: propValue, meta: updatedMeta } = evaluateExpression(prop.argument, meta);
      const result = buildCss(propValue, updatedMeta);

      callbackIfFileIncluded(meta, updatedMeta);

      resolvedBinding && assertNoImportedCssVariables(prop.argument, meta, resolvedBinding, result);

      css.push(...result.css);
      variables.push(...result.variables);
    }
  });

  return { css: mergeSubsequentUnconditionalCssItems(css), variables };
};

/**
 * Extracts CSS data from a template literal node.
 *
 * @param node Node we're interested in extracting CSS from.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
const extractTemplateLiteral = (node: t.TemplateLiteral, meta: Metadata): CSSOutput => {
  const css: CSSOutput['css'] = [];
  const variables: CSSOutput['variables'] = [];

  // Quasis are the string pieces of the template literal - the parts around the interpolations
  const literalResult = node.quasis.reduce<string>((acc, quasi, index): string => {
    const nodeExpression = node.expressions[index] as t.Expression | undefined;

    if (
      !nodeExpression ||
      (t.isArrowFunctionExpression(nodeExpression) && t.isLogicalExpression(nodeExpression.body))
    ) {
      const suffix = meta.context === 'keyframes' ? '' : ';';
      return acc + quasi.value.raw + suffix;
    }

    const { value: interpolation, meta: updatedMeta } = evaluateExpression(nodeExpression, meta);

    callbackIfFileIncluded(meta, updatedMeta);

    if (t.isStringLiteral(interpolation) || t.isNumericLiteral(interpolation)) {
      // Simple case - we can immediately inline the value.
      return acc + quasi.value.raw + interpolation.value;
    }

    if (
      t.isObjectExpression(interpolation) ||
      isCompiledCSSTaggedTemplateExpression(interpolation, meta.state) ||
      isCompiledCSSCallExpression(interpolation, meta.state) ||
      (t.isArrowFunctionExpression(nodeExpression) &&
        t.isConditionalExpression(nodeExpression.body))
    ) {
      // We found something that looks like CSS.
      const result = buildCss(interpolation, updatedMeta);

      if (result.css.length) {
        // Add previous accumulative CSS first before CSS from expressions
        css.push({ type: 'unconditional', css: acc + quasi.value.raw }, ...result.css);
        variables.push(...result.variables);
        // Reset acc as we just added them
        return '';
      }
    }

    if (
      isCompiledKeyframesCallExpression(interpolation, updatedMeta.state) ||
      isCompiledKeyframesTaggedTemplateExpression(interpolation, updatedMeta.state)
    ) {
      const {
        css: [keyframesSheet, unconditionalKeyframesItem],
        variables: keyframeVariables,
      } = extractKeyframes(interpolation, {
        ...updatedMeta,
        prefix: quasi.value.raw,
        suffix: '',
      });

      css.push(keyframesSheet);
      variables.push(...keyframeVariables);
      return acc + getItemCss(unconditionalKeyframesItem);
    }

    const { expression, variableName } = getVariableDeclaratorValueForOwnPath(nodeExpression, meta);

    // Everything else is considered a catch all expression.
    // The only difficulty here is what we do around prefixes and suffixes.
    // CSS variables can't have them! So we need to move them to the inline style.
    // E.g. `font-size: ${fontSize}px` will end up needing to look like:
    // `font-size: var(--_font-size)`, with the suffix moved to inline styles
    // style={{ '--_font-size': fontSize + 'px' }}
    const name = `--_${hash(variableName)}`;
    const nextQuasis = node.quasis[index + 1];
    const [before, after] = cssAffixInterpolation(quasi.value.raw, nextQuasis.value.raw);

    // Removes any suffixes from the next quasis.
    nextQuasis.value.raw = after.css;

    variables.push({
      name,
      expression,
      prefix: before.variablePrefix,
      suffix: after.variableSuffix,
    });

    return acc + before.css + `var(${name})`;
  }, '');

  css.push({ type: 'unconditional', css: literalResult });

  // Deals with Conditional CSS Rules from Logical Expressions
  node.expressions.forEach((prop) => {
    if (t.isArrowFunctionExpression(prop)) {
      if (t.isLogicalExpression(prop.body)) {
        const { value: propValue, meta: updatedMeta } = evaluateExpression(prop.body, meta);
        const result = buildCss(propValue, updatedMeta);

        callbackIfFileIncluded(meta, updatedMeta);

        css.push(...result.css);
        variables.push(...result.variables);
      }
    }
  });

  return {
    css: mergeSubsequentUnconditionalCssItems(css),
    variables,
  };
};

/**
 * Will return a CSS string and CSS variables array from an input node.
 *
 * @param node Node we're interested in extracting CSS from.
 * @param meta {Metadata} Useful metadata that can be used during the transformation
 */
export const buildCss = (node: t.Expression | t.Expression[], meta: Metadata): CSSOutput => {
  if (t.isStringLiteral(node)) {
    return { css: [{ type: 'unconditional', css: node.value }], variables: [] };
  }

  if (t.isTemplateLiteral(node)) {
    return extractTemplateLiteral(node, meta);
  }

  if (t.isObjectExpression(node)) {
    return extractObjectExpression(node, meta);
  }

  if (t.isArrowFunctionExpression(node) && t.isLogicalExpression(node.body)) {
    return extractLogicalExpression(node, meta);
  }

  if (t.isArrowFunctionExpression(node) && t.isConditionalExpression(node.body)) {
    return extractConditionalExpression(node.body, meta);
  }

  if (t.isIdentifier(node)) {
    const resolvedBinding = resolveBinding(node.name, meta);

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

    assertNoImportedCssVariables(node, meta, resolvedBinding, result);

    return result;
  }

  if (t.isArrayExpression(node) || Array.isArray(node)) {
    const css: CSSOutput['css'] = [];
    const variables: CSSOutput['variables'] = [];
    const elements = t.isArrayExpression(node) ? node.elements : node;

    elements.forEach((element) => {
      if (!t.isExpression(element)) {
        throw buildCodeFrameError(
          `${element && element.type} isn't a supported CSS type - try using an object or string`,
          t.isArrayExpression(node) ? node : element,
          meta.parentPath
        );
      }

      const result = t.isConditionalExpression(element)
        ? extractConditionalExpression(element, meta)
        : buildCss(element, meta);

      css.push(...result.css);
      variables.push(...result.variables);
    });

    return {
      css,
      variables,
    };
  }

  if (t.isLogicalExpression(node)) {
    const expression = node.left;
    const result = buildCss(node.right, meta);
    const css = result.css.map((item) => {
      if (item.type === 'logical') {
        return {
          ...item,
          expression: t.logicalExpression(item.operator, expression, item.expression),
        };
      }

      const logicalItem: LogicalCssItem = {
        type: 'logical',
        css: getItemCss(item),
        expression,
        operator: node.operator,
      };

      return logicalItem;
    });

    return {
      css,
      variables: result.variables,
    };
  }

  if (isCompiledCSSTaggedTemplateExpression(node, meta.state)) {
    return buildCss(node.quasi, meta);
  }

  if (isCompiledCSSCallExpression(node, meta.state)) {
    return buildCss(node.arguments[0] as t.ObjectExpression, meta);
  }

  throw buildCodeFrameError(
    `${node.type} isn't a supported CSS type - try using an object or string`,
    node,
    meta.parentPath
  );
};
