import {
  shorthandBuckets,
  shorthandFor,
  kebabCase,
  type ShorthandProperties,
} from '@compiled/utils';
import type { Rule, Scope } from 'eslint';
import type { ObjectExpression, Property } from 'estree';

import { isCss, isCssMap, isStyled } from '../../utils';

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
      description:
        'Prevent unwanted side-effect by ensuring shorthand properties are always defined before their related longhands. See more in the README.',
      recommended: true,
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/shorthand-property-sorting',
    },
    messages: {
      'shorthand-first':
        'If the intention is to override a shorthand property with a longhand, the longhand should come after otherwise it is redundant and may cause unwanted side effects with stylesheet extraction. Please remove the longhand if it is not your intention to override the shorthand.',
    },
    type: 'problem',
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
                  context.report({
                    node: propertyA.value,
                    messageId: 'shorthand-first',
                  });
                }
              }
            }
          }
          if (fixRequired && callExpressionCorrectImport(node.parent, references)) {
            context.report({
              node,
              messageId: 'shorthand-first',
            });
          }
        }
      },
    };
  },
};
