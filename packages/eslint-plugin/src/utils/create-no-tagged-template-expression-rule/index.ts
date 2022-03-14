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

          // TODO Eventually handle comments instead of skipping them
          // Skip auto-fixing comments
          if (
            quasi.quasis
              .map((q) => q.value.raw)
              .join('')
              .match(/\/\*[\s\S]*\*\//g)
          ) {
            return;
          }

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
