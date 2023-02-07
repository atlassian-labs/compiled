import type { Rule, Scope } from 'eslint';
import type { Node } from 'estree';
import type { JSXExpressionContainer } from 'estree-jsx';

import { findCompiledImportDeclarations } from '../../utils/ast';
import { addImportToDeclaration, buildImportDeclaration } from '../../utils/ast-to-string';

type Q<T> = T extends Scope.Definition ? (T['type'] extends 'Variable' ? T : never) : never;
type VariableDefinition = Q<Scope.Definition>;

const findStyleNodes = (node: Node, references: Scope.Reference[], context: Rule.RuleContext) => {
  if (node.type === 'ArrayExpression') {
    node.elements.forEach((arrayElement) => {
      if (arrayElement) {
        findStyleNodes(arrayElement, references, context);
      }
    });
  } else if (node.type === 'LogicalExpression') {
    // Traverse both values in the logical expression
    findStyleNodes(node.left, references, context);
    findStyleNodes(node.right, references, context);
  } else if (node.type === 'ConditionalExpression') {
    // Traverse both return values in the conditional expression
    findStyleNodes(node.consequent, references, context);
    findStyleNodes(node.alternate, references, context);
  } else if (node.type === 'Identifier') {
    // Resolve the variable for the reference
    const reference = references.find((reference) => reference.identifier === node);
    const definition = reference?.resolved?.defs.find(
      (def): def is VariableDefinition => def.type === 'Variable'
    );

    // Traverse to the variable value
    if (definition && definition.node.init) {
      findStyleNodes(definition.node.init, references, context);
    }
  } else if (node.type === 'MemberExpression') {
    // Since we don't support MemberExpression yet, we don't have a contract for what it should look like
    // We can skip this for now, until we implement the CSS map API
  } else if (node.type === 'ObjectExpression' || node.type === 'TemplateLiteral') {
    // We found an object expression that was not wrapped, report
    context.report({
      messageId: 'noCssFunction',
      node,
      *fix(fixer) {
        const compiledImports = findCompiledImportDeclarations(context);
        if (compiledImports.length > 0) {
          // Import found, add the specifier to it
          const [firstCompiledImport] = compiledImports;
          const specifiersString = addImportToDeclaration(firstCompiledImport, ['css']);

          yield fixer.replaceText(firstCompiledImport, specifiersString);
        } else {
          // Import not found, add a new one
          const source = context.getSourceCode();
          yield fixer.insertTextAfter(
            source.ast.body[0],
            `\n${buildImportDeclaration('css', '@compiled/react')}`
          );
        }

        if (node.type === 'ObjectExpression') {
          yield fixer.insertTextBefore(node, 'css(');
          yield fixer.insertTextAfter(node, ')');
        } else {
          yield fixer.insertTextBefore(node, 'css');
        }
      },
    });
  }
};

const createNoCssPropWithoutCssFunctionRule = (): Rule.RuleModule['create'] => (context) => ({
  'JSXAttribute[name.name="css"] JSXExpressionContainer': (node: Rule.Node): void => {
    const { references } = context.getScope();

    findStyleNodes((node as JSXExpressionContainer).expression, references, context);
  },
});

export const noCssPropWithoutCssFunctionRule: Rule.RuleModule = {
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-css-prop-without-css-function',
    },
    messages: {
      noCssFunction: 'css prop values are required to use the css import from @compiled/react',
    },
    type: 'problem',
    fixable: 'code',
  },
  create: createNoCssPropWithoutCssFunctionRule(),
};
