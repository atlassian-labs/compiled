import { shorthandBuckets, type ShorthandProperties } from '@compiled/utils';
import type { Rule } from 'eslint';
import type { Directive, ModuleDeclaration, Statement } from 'estree';

const findProgramRoot = (node: Rule.Node): Rule.Node | null => {
  const parent = node.parent;
  if (!parent) {
    return null;
  }
  if (parent.type === 'Program') {
    return parent;
  }
  return findProgramRoot(parent);
};

function camelToKebab(camelCaseString: string): string {
  return camelCaseString.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

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
    type: 'problem',
    fixable: 'code',
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
          let importedFromCorrectPackage = null;
          const program: Rule.Node | null = findProgramRoot(node);

          // make sure node is imported from the correct package
          const logicCssAndCssMap =
            node.parent.type === 'CallExpression' &&
            node.parent.callee.type === 'Identifier' &&
            (node.parent.callee.name === 'css' || node.parent.callee.name === 'cssMap');

          const logicStyled =
            node.parent.type === 'CallExpression' &&
            node.parent.callee.type === 'MemberExpression' &&
            node.parent.callee.object.type === 'Identifier' &&
            node.parent.callee.object.name === 'styled';

          const logicXcc =
            node.parent.type === 'CallExpression' &&
            node.parent.callee.type === 'Identifier' &&
            node.parent.callee.name === 'xcss';

          if (program && program.type === 'Program' && (logicCssAndCssMap || logicStyled)) {
            importedFromCorrectPackage = program.body.find(
              (n: ModuleDeclaration | Statement | Directive) => {
                return n.type === 'ImportDeclaration' && n.source.value === '@compiled/react';
              }
            );
          }
          if (program && program.type === 'Program' && logicXcc) {
            importedFromCorrectPackage = program.body.find(
              (n: ModuleDeclaration | Statement | Directive) => {
                return n.type === 'ImportDeclaration' && n.source.value === '@atlaskit/primitives';
              }
            );
          }

          // loop through the css properties of a ObjectExpression object
          node.properties.some((property) => {
            if (property.type === 'Property' && property.key.type === 'Identifier') {
              const prop = camelToKebab(property.key.name) as ShorthandProperties;
              const depth = shorthandBuckets[prop];

              // if we find a property with a with a higher depth below one with a lower depth, we trigger the eslint error
              if (depth < lowestDepth) {
                fixRequired = true;
                return;
              } else {
                lowestDepth = depth;
              }
            }
          });

          if (fixRequired && importedFromCorrectPackage) {
            context.report({
              node: node,
              messageId: 'shorthand-first',
              fix: (fixer) => {
                // sort the properties by depth
                const sortedProperties = node.properties.slice().sort((a, b) => {
                  if (
                    a.type === 'Property' &&
                    a.key.type === 'Identifier' &&
                    b.type === 'Property' &&
                    b.key.type === 'Identifier'
                  ) {
                    const propA = camelToKebab(a.key.name) as ShorthandProperties;
                    const propB = camelToKebab(b.key.name) as ShorthandProperties;

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
                return [fixer.replaceText(node, newObjectExpression)];
              },
            });
          }
        }
      },
    };
  },
};
