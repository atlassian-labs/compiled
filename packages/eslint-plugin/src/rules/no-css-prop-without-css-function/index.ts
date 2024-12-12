import { COMPILED_IMPORT } from '@compiled/utils';
import type { TSESTree, TSESLint } from '@typescript-eslint/utils';

import {
  findTSLibraryImportDeclarations,
  isNodeDOMElement,
  traverseUpToJSXOpeningElement,
} from '../../utils/ast';
import {
  addImportToDeclaration,
  buildImportDeclaration,
  getImportedName,
} from '../../utils/ast-to-string';
import { getScope, getSourceCode } from '../../utils/context-compat';

type Q<T> = T extends TSESLint.Scope.Definition
  ? T['type'] extends 'Variable'
    ? T
    : never
  : never;
type VariableDefinition = Q<TSESLint.Scope.Definition>;
type ParameterDefinition = TSESLint.Scope.Definitions.ParameterDefinition;

type CSSValue = TSESTree.Expression | TSESTree.JSXEmptyExpression;
type Reference = TSESLint.Scope.Reference;
type Context = TSESLint.RuleContext<string, readonly unknown[]>;

const findNodeReference = (
  references: Reference[],
  node: TSESTree.Expression
): Reference | undefined => {
  return references.find((reference) => reference.identifier === node);
};

class NoCssPropWithoutCssFunctionRunner {
  private excludeReactComponents: boolean;
  private ignoreIfImported: string[];
  private jsxElement: TSESTree.JSXOpeningElement;
  private references: Reference[];

  constructor(private baseNode: TSESTree.JSXExpressionContainer, private context: Context) {
    this.jsxElement = traverseUpToJSXOpeningElement(this.baseNode);
    this.references = getScope(context, baseNode).references;

    this.ignoreIfImported = [];
    this.excludeReactComponents = false;
    this.parseOptions(this.context.options as any);
  }

  private parseOptions(options: any[]) {
    if (options.length === 0) return;

    if (options[0].ignoreIfImported && Array.isArray(options[0].ignoreIfImported)) {
      this.ignoreIfImported = options[0].ignoreIfImported;
    }

    if (typeof options[0].excludeReactComponents === 'boolean') {
      this.excludeReactComponents = options[0].excludeReactComponents;
    } else if (options[0].excludeReactComponents !== undefined) {
      throw new Error(
        `Expected the excludeReactComponents option to be a boolean, actually got ${typeof options[0]
          .excludeReactComponents}`
      );
    }
  }

  private importsIgnoredLibraries() {
    if (!this.ignoreIfImported.length) return;

    return findTSLibraryImportDeclarations(this.context, this.ignoreIfImported).length > 0;
  }

  private handleIdentifier(node: TSESTree.Identifier) {
    // Resolve the variable for the reference
    const reference = findNodeReference(this.references, node);
    const definition = reference?.resolved?.defs.find(
      (def): def is VariableDefinition => def.type === 'Variable'
    );

    // Traverse to the variable value
    if (definition && definition.node.init) {
      this.findStyleNodes(definition.node.init);
    } else {
      const isImported = reference?.resolved?.defs.find((def) => def.type === 'ImportBinding');
      const isFunctionParameter = reference?.resolved?.defs.find((def) => def.type === 'Parameter');

      // css property on DOM elements are always fine, e.g.
      // <div css={...}> instead of <MyComponent css={...}>
      if (isNodeDOMElement(this.jsxElement)) {
        return;
      }

      if (isImported) {
        this.context.report({
          messageId: 'importedInvalidCssUsage',
          node,
        });
      } else if (isFunctionParameter) {
        this.context.report({
          messageId: 'functionParameterInvalidCssUsage',
          node,
        });
      } else {
        this.context.report({
          messageId: 'otherInvalidCssUsage',
          node,
        });
      }
    }
  }

  private handleMemberExpression(node: TSESTree.MemberExpression) {
    const reference = findNodeReference(this.references, node.object);
    const definition = reference?.resolved?.defs.find(
      (def): def is ParameterDefinition => def.type === 'Parameter'
    );

    if (definition) {
      this.context.report({
        messageId: 'functionParameterInvalidCssUsage',
        node,
      });
    }
  }

  private fixWrapper(node: CSSValue, context: Context) {
    function* fix(fixer: TSESLint.RuleFixer) {
      const compiledImports = findTSLibraryImportDeclarations(context);
      const source = getSourceCode(context);

      // The string that `css` from `@compiled/css` is imported as
      const cssImportName = getImportedName(compiledImports, 'css');

      if (compiledImports.length > 0) {
        if (!cssImportName) {
          // Import found, add the specifier to it
          const [firstCompiledImport] = compiledImports;
          const specifiersString = addImportToDeclaration(firstCompiledImport, ['css']);

          yield fixer.replaceText(firstCompiledImport, specifiersString);
        }
      } else {
        // Import not found, add a new one
        yield fixer.insertTextAfter(
          source.ast.body[0],
          `\n${buildImportDeclaration('css', COMPILED_IMPORT)}`
        );
      }

      const cssFunctionName = cssImportName ?? 'css';

      if (node.type === 'ObjectExpression') {
        const parent = node.parent;
        if (parent && parent.type === 'TSAsExpression') {
          yield fixer.replaceText(parent, `${cssFunctionName}(${source.getText(node)})`);
        } else {
          yield fixer.insertTextBefore(node, `${cssFunctionName}(`);
          yield fixer.insertTextAfter(node, ')');
        }
      } else {
        yield fixer.insertTextBefore(node, cssFunctionName);
      }
    }

    return fix;
  }

  private findStyleNodes(node: CSSValue): void {
    if (node.type === 'ArrayExpression') {
      node.elements.forEach((arrayElement) => {
        if (arrayElement && arrayElement.type !== 'SpreadElement') {
          this.findStyleNodes(arrayElement);
        }
      });
    } else if (node.type === 'LogicalExpression') {
      this.findStyleNodes(node.right);
    } else if (node.type === 'ConditionalExpression') {
      // Traverse both return values in the conditional expression
      this.findStyleNodes(node.consequent);
      this.findStyleNodes(node.alternate);
    } else if (node.type === 'Identifier') {
      this.handleIdentifier(node);
    } else if (node.type === 'MemberExpression') {
      this.handleMemberExpression(node);
    } else if (node.type === 'ObjectExpression' || node.type === 'TemplateLiteral') {
      // We found an object expression that was not wrapped, report
      this.context.report({
        messageId: 'noCssFunction',
        node,
        fix: this.fixWrapper(node, this.context),
      });
    } else if (node.type === 'TSAsExpression') {
      // TSAsExpression is anything in the form "X as Y", e.g.:
      // const abc = { ... } as const;
      return this.findStyleNodes(node.expression);
    }
  }

  run() {
    if (!this.importsIgnoredLibraries()) {
      if (this.excludeReactComponents && !isNodeDOMElement(this.jsxElement)) {
        return;
      }
      this.findStyleNodes(this.baseNode.expression);
    }
  }
}

const createNoCssPropWithoutCssFunctionRule =
  (): TSESLint.RuleModule<string>['create'] => (context) => ({
    'JSXAttribute[name.name="css"] JSXExpressionContainer': (
      node: TSESTree.JSXExpressionContainer
    ): void => {
      const runner = new NoCssPropWithoutCssFunctionRunner(node, context);
      runner.run();
    },
  });

export const noCssPropWithoutCssFunctionRule: TSESLint.RuleModule<string> = {
  defaultOptions: [],
  meta: {
    docs: {
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-css-prop-without-css-function',
      description:
        'Disallows `css` prop usages where it is either not wrapped in the `css` import from `@compiled/react` or where `@compiled` cannot determine whether the `css` import is included at build time.',
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
    schema: [
      {
        type: 'object',
        properties: {
          ignoreIfImported: {
            type: 'array',
            items: [
              {
                type: 'string',
              },
            ],
          },
          excludeReactComponents: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: createNoCssPropWithoutCssFunctionRule(),
};
