import {
  shorthandBuckets,
  shorthandFor,
  kebabCase,
  type ShorthandProperties,
} from '@compiled/utils';
import type { Rule, Scope } from 'eslint';
import type { ObjectExpression, Property } from 'estree';

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

const arePropertiesInTheRightOrder = (
  node: ObjectExpression,
  propertyA: Property,
  i: number
): boolean => {
  if (node.properties.length > 0 && propertyA.key.type === 'Identifier') {
    const propA = kebabCase(propertyA.key.name) as ShorthandProperties;
    const depthA = shorthandBuckets[propA];

    for (let j = i + 1; j < node.properties.length; j++) {
      const propertyB = node.properties[j];

      if (propertyB.type === 'Property') {
        if (propertyB.key.type === 'Identifier') {
          const propB = kebabCase(propertyB.key.name) as ShorthandProperties;
          const depthB = shorthandBuckets[propB];

          const shorthandForResA = shorthandFor[propA];
          const shorthandForResB = shorthandFor[propB];

          if (Array.isArray(shorthandForResA) && Array.isArray(shorthandForResB)) {
            // find intersection between objects
            const intersectionAB = shorthandForResA.filter((x) => shorthandForResB.includes(x));

            if (intersectionAB.length > 0 && depthB < depthA) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
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
          const references = context.getScope().references;
          let fixRequired = false;

          for (let i = 0; i < node.properties.length; i++) {
            const propertyA = node.properties[i];
            if (fixRequired) break;

            if (propertyA.type === 'Property') {
              // normal property case
              if (propertyA.key.type === 'Identifier') {
                fixRequired = arePropertiesInTheRightOrder(node, propertyA, i);
              }
              // pseudo selector case
              if (
                propertyA.value.type === 'ObjectExpression' &&
                propertyA.value.properties.length > 0
              ) {
                let innerFixRequired = false;
                // if it's a pseudo selector, we treat their selectors as an isolated case
                // we loop through their properties and check if they are in the right order
                for (let l = 0; l < propertyA.value.properties.length; l++) {
                  if (innerFixRequired) break;

                  const propertyAA = propertyA.value.properties[l];

                  if (propertyAA.type === 'Property' && propertyAA.key.type === 'Identifier') {
                    innerFixRequired = arePropertiesInTheRightOrder(propertyA.value, propertyAA, l);
                  }
                }
                if (innerFixRequired && callExpressionCorrectImport(node.parent, references)) {
                  fixProperties(context, propertyA.value as Rule.Node);
                }
              }
            }
          }
          if (fixRequired && callExpressionCorrectImport(node.parent, references)) {
            fixProperties(context, node);
          }
        }
      },
    };
  },
};
