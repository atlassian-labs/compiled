import type { Rule } from 'eslint';
import type {
  CallExpression as ESCallExpression,
  Expression,
  ObjectExpression,
  Property,
  Super,
} from 'estree';

import { isCssMap } from '../../utils';
import { COMPILED_IMPORT } from '../../utils/constants';
import { validateDefinition } from '../../utils/create-no-exported-rule/validate-definition';

type Node = Rule.Node;
type CallExpression = ESCallExpression & Rule.NodeParentExtension;
type Reporter = Rule.RuleContext['report'];

const getAllowedFunctionCalls = (options: any[]): string[] => {
  function assertIsStringArray(myArray: any[]): asserts myArray is string[] {
    if (Array.isArray(myArray) && myArray.every((entry) => typeof entry === 'string')) return;
    throw new Error('The allowedFunctionCalls option must be an array of strings.');
  }

  // ESLint (before v9) doesn't check that the options are actually valid, so we
  // have to check this ourselves...

  if (options.length === 0 || options[0]?.allowedFunctionCalls === undefined) {
    return [];
  }

  const allowedFunctionCalls: unknown[] = options[0].allowedFunctionCalls;
  assertIsStringArray(allowedFunctionCalls);

  return allowedFunctionCalls;
};

const reportIfExported = (node: CallExpression, context: Rule.RuleContext, report: Reporter) => {
  const state = validateDefinition(context, node);
  if (state.type === 'valid') {
    return;
  }

  report({
    messageId: 'noExportedCssMap',
    node: state.node,
  });
};

const reportIfNotTopLevelScope = (node: CallExpression, report: Reporter) => {
  // Treat `export` keyword as valid because the noExportedCssMap rule already handles those
  const validTypes: Readonly<Node['type'][]> = [
    'ExportDefaultDeclaration',
    'ExportNamedDeclaration',
    'Program',
    'VariableDeclaration',
    'VariableDeclarator',
  ] as const;

  let parentNode = node.parent;
  while (parentNode) {
    if (!validTypes.includes(parentNode.type)) {
      report({ node: node, messageId: 'mustBeTopLevelScope' });
      return;
    }
    parentNode = parentNode.parent;
  }
};

const isNotWhitelistedFunction = (callee: Expression | Super, whitelistedFunctions: string[]) => {
  if (callee.type !== 'Identifier') {
    return true;
  }

  return !whitelistedFunctions.includes(callee.name);
};

const checkCssMapObjectValue = (
  value: Property['value'],
  allowedFunctionCalls: string[],
  report: Reporter
) => {
  if (
    value.type === 'CallExpression' &&
    isNotWhitelistedFunction(value.callee, allowedFunctionCalls)
  ) {
    // object value is a function call in the style
    // {
    //     key: functionCall(), ...
    // }
    report({
      node: value,
      messageId: 'noFunctionCalls',
    });
  } else if (value.type === 'ArrowFunctionExpression' || value.type === 'FunctionExpression') {
    // object value is a function call in the style
    // {
    //     key: (prop) => prop.color,       // ArrowFunctionExpression
    //     get danger() { return { ... } }, // FunctionExpression
    // }
    report({
      node: value,
      messageId: 'noFunctionCalls',
    });
  } else if (value.type === 'BinaryExpression' || value.type === 'LogicalExpression') {
    checkCssMapObjectValue(value.left, allowedFunctionCalls, report);
    checkCssMapObjectValue(value.right, allowedFunctionCalls, report);
  } else if (value.type === 'Identifier') {
    throw new Error('TODO: not implemented');
  } else if (value.type === 'ObjectExpression') {
    // Object inside another object
    checkCssMapObject(value, allowedFunctionCalls, report);
  } else if (value.type === 'TemplateLiteral') {
    // object value is a template literal, something like
    //     `hello world`
    //     `hello ${functionCall()} world`
    //     `hello ${someVariable} world`
    // etc.
    //
    // where the expressions are the parts enclosed within the
    // ${ ... }
    for (const expression of value.expressions) {
      checkCssMapObjectValue(expression, allowedFunctionCalls, report);
    }
  }
};

const checkCssMapObject = (
  cssMapObject: ObjectExpression,
  allowedFunctionCalls: string[],
  report: Reporter
) => {
  for (const property of cssMapObject.properties) {
    if (property.type === 'SpreadElement') {
      report({
        node: property,
        messageId: 'noSpreadElement',
      });
      continue;
    }

    checkCssMapObjectValue(property.value, allowedFunctionCalls, report);
  }
};

const createCssMapRule = (context: Rule.RuleContext): Rule.RuleListener => {
  const { text } = context.sourceCode;
  if (!text.includes(COMPILED_IMPORT)) {
    return {};
  }

  return {
    CallExpression(node) {
      const { references } = context.getScope();
      const allowedFunctionCalls: string[] = getAllowedFunctionCalls(context.options);

      if (!isCssMap(node.callee as Node, references)) {
        return;
      }

      // Things like the number of arguments to cssMap and the type of
      // cssMap's argument are handled by the TypeScript compiler, so
      // we don't bother with creating eslint errors for these here

      if (node.arguments.length !== 1) {
        return;
      }

      const cssMapObject = node.arguments[0];
      if (cssMapObject.type !== 'ObjectExpression') {
        return;
      }

      reportIfExported(node, context, context.report);
      reportIfNotTopLevelScope(node, context.report);
      checkCssMapObject(cssMapObject, allowedFunctionCalls, context.report);
    },
  };
};

export const noInvalidCssMapRule: Rule.RuleModule = {
  meta: {
    docs: {
      description:
        "Checks the validity of a CSS map created through cssMap. This is intended to be used alongside TypeScript's type-checking.",
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/no-invalid-css-map',
    },
    messages: {
      mustBeTopLevelScope: 'cssMap must only be used in the top-most scope of the module.',
      noExportedCssMap: 'cssMap usages cannot be exported.',
      noFunctionCalls: 'Cannot use function calls in cssMap.',
      noSpreadElement: 'Cannot use the spread operator in cssMap.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedFunctionCalls: {
            type: 'array',
            items: {
              type: 'string',
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
