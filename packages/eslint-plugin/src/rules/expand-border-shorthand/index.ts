import type { Rule } from 'eslint';
import type { Property, SpreadElement } from 'estree';

const loopProperties = (properties: (Property | SpreadElement)[], context: Rule.RuleContext) => {
  properties.forEach((property) => {
    if (property.type === 'Property') {
      if (property.key.type === 'Identifier' && property.key.name === 'border') {
        // we found a 'border' property
        if (property.value.type === 'Literal') {
          if (property.value.value && typeof property.value.value === 'string') {
            const borderString: string = property.value.value;
            const borderRegex =
              /^(?<style>(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden|inherit|initial|revert|revert-layer|unset|))?\s*(?<width>(thin|medium|thick|inherit|initial|revert|revert-layer|unset|\d+(\.\d+)?(px|em|rem|cm|%)?))?\s*(?<color>(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|token\(([^)]+)\)|rgb\(([^)]+)\)|rgba\(([^)]+)\)|hsl\(([^)]+)\)|hsla\(([^)]+)\)|[a-zA-Z]{3,20})?)$|^(?<width2>(thin|medium|thick|inherit|initial|revert|revert-layer|unset|\d+(\.\d+)?(px|em|rem|cm|%)?))?\s*(?<style2>(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden|inherit|initial|revert|revert-layer|unset|))?\s*(?<color2>(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|token\(([^)]+)\)|rgb\(([^)]+)\)|rgba\(([^)]+)\)|hsl\(([^)]+)\)|hsla\(([^)]+)\)|[a-zA-Z]{3,20})?)$/;

            const match = borderString.match(borderRegex);

            if (match) {
              const { style, width, color, style2, width2, color2 } = match.groups || {};

              // borderWidth and borderStyle can be in either order, borderColor is always last
              const borderWidth = width || width2 || '';
              const borderStyle = style || style2 || '';
              const borderColor = color || color2 || '';

              if (borderWidth && borderStyle && borderColor) {
                context.report({
                  node: property.key,
                  messageId: 'expandBorderShorthand',
                  fix: (fixer) => {
                    const fixes = [];

                    const propertyRangeStart = property.range ? property.range[0] : undefined;
                    const propertyRangeEnd = property.range ? property.range[1] : undefined;
                    const nextSibling = properties[properties.indexOf(property) + 1];

                    if (propertyRangeEnd && propertyRangeStart) {
                      // Remove the original property
                      fixes.push(fixer.remove(property));

                      // Prepare the new properties to insert
                      const newProperties = `borderWidth: '${borderWidth}', borderStyle: '${borderStyle}', borderColor: '${borderColor}', `;

                      // Insert new properties after the property range
                      fixes.push(
                        fixer.insertTextAfterRange(
                          [propertyRangeStart, propertyRangeEnd],
                          newProperties
                        )
                      );

                      // Remove trailing commas
                      if (nextSibling && nextSibling.range) {
                        fixes.push(fixer.removeRange([propertyRangeEnd, nextSibling.range[0]]));
                      } else {
                        fixes.push(fixer.removeRange([propertyRangeEnd, propertyRangeEnd + 1]));
                      }
                    }
                    return fixes;
                  },
                });
              }
            }
          }
        }
      }
    }
  });
};

const selectorString =
  'CallExpression[callee.type="Identifier"][callee.name="css"] > ObjectExpression, ' +
  'CallExpression[callee.type="MemberExpression"][callee.object.type="Identifier"][callee.object.name="styled"] > ObjectExpression, ' +
  'CallExpression[callee.type="Identifier"][callee.name="cssMap"] > ObjectExpression';

export const expandBorderShorthand: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/expand-border-shorthand',
    },
    fixable: 'code',
    messages: {
      expandBorderShorthand:
        'Use borderColor, borderStyle, and borderWidth instead of border shorthand',
    },
    type: 'problem',
  },

  create(context) {
    return {
      [selectorString]: (node: Rule.Node) => {
        if (node.type === 'ObjectExpression' && node.properties) {
          loopProperties(node.properties, context);
        }
      },
    };
  },
};
