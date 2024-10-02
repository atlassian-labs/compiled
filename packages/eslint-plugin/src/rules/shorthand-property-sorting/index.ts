import { shorthandBuckets, kebabCase, type ShorthandProperties } from '@compiled/utils';
import type { Rule, Scope } from 'eslint';

import { isStyled, isCss, isCssMap } from '../../index';

const fixProperties = (context: Rule.RuleContext, node: Rule.Node) => {
  context.report({
    node: node,
    messageId: 'shorthand-first',
    fix: (fixer) => {
      if (node.type === 'ObjectExpression' && node.properties.length > 0) {
        // sort the properties by depth
        const sortedProperties = node.properties.slice().sort((a, b) => {
          if (
            a.type === 'Property' &&
            a.key.type === 'Identifier' &&
            b.type === 'Property' &&
            b.key.type === 'Identifier'
          ) {
            const propA = kebabCase(a.key.name) as ShorthandProperties;
            const propB = kebabCase(b.key.name) as ShorthandProperties;

            return shorthandBuckets[propA] - shorthandBuckets[propB];
          }
          return 0;
        });

        const sourceCode = context.getSourceCode();
        const sortedCode = sortedProperties
          .map((property) => sourceCode.getText(property))
          .join(', ');

        // Replace the old object expression with the new sorted one
        const newObjectExpression = `{ ${sortedCode} }`;

        return fixer.replaceText(node, newObjectExpression);
      }
      return null;
    },
  });
};

const callExpressionCorrectImport = (node: Rule.Node, references: Scope.Reference[]): boolean => {
  return (
    node.type === 'CallExpression' &&
    (isCss(node.callee as Rule.Node, references) ||
      isCssMap(node.callee as Rule.Node, references) ||
      isStyled(node.callee as Rule.Node, references))
  );
};

export const shorthandFirst: Rule.RuleModule = {
  meta: {
    docs: {
      recommended: true,
      description:
        "At build time, Compiled automatically sorts shorthand properties (like `font` and `border`) so that they come before any longhand properties (like `fontSize` and `borderTopColor`) defined on the component. This means that longhand properties will always override shorthand properties. This rule enforces that the order in which the properties appear in a component's source code matches the actual ordering the properties will have at build time and runtime.",
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/shorthand-property-sorting',
    },
    messages: {
      'shorthand-first':
        'When using both shorthand and longhand properties, the shorthand property should be first.',
    },
    type: 'suggestion',
    fixable: 'code',
    hasSuggestions: true,
  },
  create(context) {
    const selectorString: string =
      'CallExpression[callee.type="Identifier"][callee.name="css"] > ObjectExpression,' +
      'CallExpression[callee.type="Identifier"][callee.name="cssMap"] > ObjectExpression,' +
      'CallExpression[callee.type="Identifier"][callee.name="xcss"] > ObjectExpression,' +
      'CallExpression[callee.type="MemberExpression"][callee.object.name="styled"] > ObjectExpression';

    return {
      [selectorString]: (node: Rule.Node) => {
        if (node.type === 'ObjectExpression' && node.properties.length > 0) {
          let lowestDepth = 0;
          let fixRequired = false;

          const references = context.getScope().references;

          // loop through the css properties of a ObjectExpression object
          node.properties.some((property) => {
            if (fixRequired) return;
            if (property.type === 'Property') {
              // normal case
              if (property.key.type === 'Identifier') {
                const prop = kebabCase(property.key.name) as ShorthandProperties;
                const depth = shorthandBuckets[prop];

                // if we find a property with a with a higher depth below one with a lower depth, we trigger the eslint error
                if (depth < lowestDepth) {
                  fixRequired = true;
                  return;
                } else {
                  lowestDepth = depth;
                }
              }
              // pseduo-property case
              if (
                property.value.type === 'ObjectExpression' &&
                property.value.properties.length > 0
              ) {
                let innerLowestDepth = 0;
                let innerFixRequired = false;

                property.value.properties.some((innerProperty) => {
                  if (innerFixRequired) return;
                  if (
                    innerProperty.type === 'Property' &&
                    innerProperty.key.type === 'Identifier'
                  ) {
                    const prop = kebabCase(innerProperty.key.name) as ShorthandProperties;
                    const depth = shorthandBuckets[prop];

                    // if we find a property with a with a higher depth below one with a lower depth, we trigger the eslint error
                    if (depth < innerLowestDepth) {
                      innerFixRequired = true;
                      return;
                    } else {
                      innerLowestDepth = depth;
                    }
                  }
                });
                if (innerFixRequired && callExpressionCorrectImport(node.parent, references)) {
                  fixProperties(context, property.value as Rule.Node);
                }
              }
            }
          });

          if (fixRequired && callExpressionCorrectImport(node.parent, references)) {
            fixProperties(context, node);
          }
        }
      },
    };
  },
};
