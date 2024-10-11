import { COMPILED_IMPORT } from '@compiled/utils';
import type { Rule, Scope } from 'eslint';

import { checkIfCompiledExport } from './check-if-compiled-export';

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
    if (!text.includes(COMPILED_IMPORT)) {
      return {};
    }

    return {
      CallExpression(node) {
        const { references } = context.getScope();
        if (!isUsage(node.callee as Rule.Node, references)) {
          return;
        }

        const state = checkIfCompiledExport(context, node);
        if (!state.isExport) {
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

        const state = checkIfCompiledExport(context, node);
        if (!state.isExport) {
          return;
        }

        context.report({
          messageId,
          node: state.node,
        });
      },
    };
  };
