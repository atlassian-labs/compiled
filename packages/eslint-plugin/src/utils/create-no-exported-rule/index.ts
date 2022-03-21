import type { Rule, Scope } from 'eslint';

import { validateDefinition } from './validate-definition';

type Node = Rule.Node;
type Reference = Scope.Reference;
type RuleModule = Rule.RuleModule;

export const createNoExportedRule =
  (
    isUsage: (node: Node, references: Reference[]) => boolean,
    messageId: string
  ): RuleModule['create'] =>
  (context) => {
    const { text } = context.getSourceCode();
    if (!text.includes('@compiled/react')) {
      return {};
    }

    return {
      CallExpression(node) {
        const { references } = context.getScope();
        if (!isUsage(node.callee as Rule.Node, references)) {
          return;
        }

        const state = validateDefinition(context, node);
        if (state.type === 'valid') {
          return;
        }

        context.report({
          messageId,
          node: state.node,
        });
      },
      TaggedTemplateExpression(node) {
        const { references } = context.getScope();
        if (!isUsage(node.tag as Rule.Node, references)) {
          return;
        }

        const state = validateDefinition(context, node);
        if (state.type === 'valid') {
          return;
        }

        context.report({
          messageId,
          node: state.node,
        });
      },
    };
  };
