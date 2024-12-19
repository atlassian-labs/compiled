import { DEFAULT_IMPORT_SOURCES } from '@compiled/utils';
import type { Rule } from 'eslint';
import type { CallExpression as ESCallExpression } from 'estree';

import { CssMapObjectChecker, getCssMapObject, isCssMap, validateDefinition } from '../../utils';
import { getScope, getSourceCode } from '../../utils/context-compat';

type CallExpression = ESCallExpression & Rule.NodeParentExtension;

const reportIfExported = (node: CallExpression, context: Rule.RuleContext) => {
  const state = validateDefinition(context, node);
  if (!state.isExport) {
    return;
  }

  context.report({
    messageId: 'noExportedCssMap',
    node: state.node,
  });
};

const reportIfNotTopLevelScope = (node: CallExpression, context: Rule.RuleContext) => {
  // Treat `export` keyword as valid because the reportIfExported function already handles those
  const validTypes: Readonly<Rule.Node['type'][]> = [
    'ExportDefaultDeclaration',
    'ExportNamedDeclaration',
    'Program',
    'VariableDeclaration',
    'VariableDeclarator',
  ] as const;

  let parentNode = node.parent;
  while (parentNode) {
    if (!validTypes.includes(parentNode.type)) {
      context.report({ node: node, messageId: 'mustBeTopLevelScope' });
      return;
    }
    parentNode = parentNode.parent;
  }
};

const createCssMapRule = (context: Rule.RuleContext): Rule.RuleListener => {
  const { text } = getSourceCode(context);

  // Bail out if this is not one of the imports we care about (eg. not from @compiled/react)
  if (DEFAULT_IMPORT_SOURCES.every((source) => !text.includes(source))) {
    return {};
  }

  return {
    CallExpression(node) {
      const references = getScope(context, node).references;

      if (!isCssMap(node.callee as Rule.Node, references)) {
        return;
      }

      reportIfExported(node, context);
      reportIfNotTopLevelScope(node, context);

      const cssMapObject = getCssMapObject(node);
      if (!cssMapObject) return;

      const cssMapObjectChecker = new CssMapObjectChecker(cssMapObject, context);
      cssMapObjectChecker.run();
    },
  };
};

export const noInvalidCssMapRule: Rule.RuleModule = {
  meta: {
    docs: {
      recommended: true,
      description:
        "Checks the validity of a CSS map created through cssMap. This is intended to be used alongside TypeScript's type-checking.",
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-invalid-css-map',
    },
    messages: {
      mustBeTopLevelScope: 'cssMap must only be used in the top-most scope of the module.',
      noNonStaticallyEvaluable:
        'Cannot statically evaluate the value of this variable. Values used in the cssMap function call should have a value evaluable at build time.',
      noExportedCssMap: 'cssMap usages cannot be exported.',
      noInlineFunctions:
        'Cannot use functions as values in cssMap - values must only be statically evaluable values (e.g. strings, numbers).',
      noFunctionCalls:
        'Cannot call external functions in cssMap - values must only be statically evaluable values (e.g. strings, numbers).',
      noSpreadElement: 'Cannot use the spread operator in cssMap.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedFunctionCalls: {
            type: 'array',
            items: {
              type: 'array',
              minItems: 2,
              maxItems: 2,
              items: [{ type: 'string' }, { type: 'string' }],
            },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    type: 'problem',
  },
  create: createCssMapRule,
};
