import type { TSESTree, TSESLint } from '@typescript-eslint/utils';

import {
  findTSCompiledImportDeclarations,
  isDOMElement,
  traverseUpToJSXOpeningElement,
} from '../../utils/ast';
import { addImportToDeclaration, buildImportDeclaration } from '../../utils/ast-to-string';

type Q<T> = T extends TSESLint.Scope.Definition
  ? T['type'] extends 'Variable'
    ? T
    : never
  : never;
type VariableDefinition = Q<TSESLint.Scope.Definition>;
type ParameterDefinition = TSESLint.Scope.Definitions.ParameterDefinition;

type CSSValue = TSESTree.Expression | TSESTree.JSXEmptyExpression;
type Reference = TSESLint.Scope.Reference;
type Context = TSESLint.RuleContext<string, readonly []>;

const findNodeReference = (
  references: Reference[],
  node: TSESTree.Expression
): Reference | undefined => {
  return references.find((reference) => reference.identifier === node);
};

const handleMemberExpression = (
  node: TSESTree.MemberExpression,
  references: Reference[],
  context: Context
) => {
  const reference = findNodeReference(references, node.object);
  const definition = reference?.resolved?.defs.find(
    (def): def is ParameterDefinition => def.type === 'Parameter'
  );

  if (definition) {
    context.report({
      messageId: 'functionParameterInvalidCssUsage',
      node,
    });
  }
};

const findStyleNodes = (node: CSSValue, references: Reference[], context: Context): void => {
  if (node.type === 'ArrayExpression') {
    node.elements.forEach((arrayElement) => {
      if (arrayElement && arrayElement.type !== 'SpreadElement') {
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
    const reference = findNodeReference(references, node);
    const definition = reference?.resolved?.defs.find(
      (def): def is VariableDefinition => def.type === 'Variable'
    );

    // Traverse to the variable value
    if (definition && definition.node.init) {
      findStyleNodes(definition.node.init, references, context);
    } else {
      const isImported = reference?.resolved?.defs.find((def) => def.type === 'ImportBinding');
      const isFunctionParameter = reference?.resolved?.defs.find((def) => def.type === 'Parameter');

      const jsxElement = traverseUpToJSXOpeningElement(node);

      // css property on DOM elements are always fine, e.g.
      // <div css={...}> instead of <MyComponent css={...}>
      if (jsxElement.name.type === 'JSXIdentifier' && isDOMElement(jsxElement.name.name)) {
        return;
      }

      if (isImported) {
        context.report({
          messageId: 'importedInvalidCssUsage',
          node,
        });
      } else if (isFunctionParameter) {
        context.report({
          messageId: 'functionParameterInvalidCssUsage',
          node,
        });
      } else {
        context.report({
          messageId: 'otherInvalidCssUsage',
          node,
        });
      }
    }
  } else if (node.type === 'MemberExpression') {
    handleMemberExpression(node, references, context);
  } else if (node.type === 'ObjectExpression' || node.type === 'TemplateLiteral') {
    // We found an object expression that was not wrapped, report
    context.report({
      messageId: 'noCssFunction',
      node,
      *fix(fixer: TSESLint.RuleFixer) {
        const compiledImports = findTSCompiledImportDeclarations(context);
        const source = context.getSourceCode();

        if (compiledImports.length > 0) {
          // Import found, add the specifier to it
          const [firstCompiledImport] = compiledImports;
          const specifiersString = addImportToDeclaration(firstCompiledImport, ['css']);

          yield fixer.replaceText(firstCompiledImport, specifiersString);
        } else {
          // Import not found, add a new one
          yield fixer.insertTextAfter(
            source.ast.body[0],
            `\n${buildImportDeclaration('css', '@compiled/react')}`
          );
        }

        if (node.type === 'ObjectExpression') {
          const parent = node.parent;
          if (parent && parent.type === 'TSAsExpression') {
            yield fixer.replaceText(parent, `css(${source.getText(node)})`);
          } else {
            yield fixer.insertTextBefore(node, 'css(');
            yield fixer.insertTextAfter(node, ')');
          }
        } else {
          yield fixer.insertTextBefore(node, 'css');
        }
      },
    });
  } else if (node.type === 'TSAsExpression') {
    // TSAsExpression is anything in the form "X as Y", e.g.:
    // const abc = { ... } as const;
    return findStyleNodes(node.expression, references, context);
  }
};

const createNoCssPropWithoutCssFunctionRule =
  (): TSESLint.RuleModule<string>['create'] => (context) => ({
    'JSXAttribute[name.name="css"] JSXExpressionContainer': (
      node: TSESTree.JSXExpressionContainer
    ): void => {
      const { references } = context.getScope();

      findStyleNodes(node.expression, references, context);
    },
  });

export const noCssPropWithoutCssFunctionRule: TSESLint.RuleModule<string> = {
  defaultOptions: [],
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-css-prop-without-css-function',
      recommended: 'error',
      description:
        'Disallows `css` prop usages without wrapping in the `css` import from `@compiled/react`. Also forbids `css` prop usages where Compiled cannot determine whether the `css` import is included at build time.',
    },
    messages: {
      noCssFunction: 'css prop values are required to use the css import from @compiled/react',
      importedInvalidCssUsage:
        'Compiled cannot determine the value of imported values in the css attribute at build time. If this component uses Compiled, this will cause a build error or invalid CSS! Consider moving the value into the same file.',
      functionParameterInvalidCssUsage:
        'Compiled cannot determine the value of function props in the css attribute at build time. If this component uses Compiled, this will cause a build error or invalid CSS! Consider moving the value into the same file.',
      otherInvalidCssUsage:
        'Compiled cannot determine the value of this expression in the css attribute at build time. If this component uses Compiled, this will cause a build error or invalid CSS! Consider moving the value into the same file.',
    },
    type: 'problem',
    fixable: 'code',
    schema: [],
  },
  create: createNoCssPropWithoutCssFunctionRule(),
};
