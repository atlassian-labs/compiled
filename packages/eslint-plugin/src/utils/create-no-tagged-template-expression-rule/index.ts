import type { Rule, Scope } from 'eslint';

import { generate } from './generate';
import { getTaggedTemplateExpressionOffset } from './get-tagged-template-expression-offset';
import { toArguments } from './to-arguments';

type Node = Rule.Node;
type Reference = Scope.Reference;
type RuleModule = Rule.RuleModule;
type RuleFixer = Rule.RuleFixer;

export const createNoTaggedTemplateExpressionRule =
  (
    isUsage: (node: Node, references: Reference[]) => boolean,
    messageId: string
  ): RuleModule['create'] =>
  (context) => ({
    TaggedTemplateExpression(node) {
      const { references } = context.getScope();
      if (!isUsage(node.tag as Rule.Node, references)) {
        return;
      }

      context.report({
        messageId,
        node,
        *fix(fixer: RuleFixer) {
          const { quasi, tag } = node;
          const source = context.getSourceCode();
          yield fixer.insertTextBefore(
            node,
            source.getText(tag) +
              // Indent the arguments after the tagged template expression range
              generate(toArguments(source, quasi), getTaggedTemplateExpressionOffset(node))
          );
          yield fixer.remove(node);
        },
      });
    },
  });
