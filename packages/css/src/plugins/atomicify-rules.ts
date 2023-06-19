import { hash } from '@compiled/utils';
import type { CustomAtRules, Rule, Visitor } from 'lightningcss';

interface AtomicifyRulesOptions {
  callback?: (className: string) => void;
  classNameCompressionMap?: { [index: string]: string };
}

/**
 * Transforms a stylesheet into atomic rules
 */
export const atomicifyRules = ({
  callback,
}: AtomicifyRulesOptions = {}): Visitor<CustomAtRules> => ({
  // Flatten rules
  Rule(rule: Rule) {
    if (rule.type !== 'style') {
      return;
    }

    const {
      value: { rules, selectors },
    } = rule;
    if (!rules?.length) {
      return;
    }

    // We only need to flatten one level, pre-order traversal from lightning will handle the rest
    const flattenedRules: Rule[] = [
      {
        type: 'style',
        value: {
          ...rule.value,
          rules: [],
        },
      },
    ];

    for (const nestedRule of rules) {
      // @ts-expect-error
      if (nestedRule.value?.selectors) {
        flattenedRules.push({
          ...nestedRule,
          // @ts-expect-error
          value: {
            // @ts-expect-error
            ...nestedRule.value,
            selectors: selectors.map((selector) => {
              // @ts-expect-error
              return nestedRule.value.selectors.flatMap((nestedSelector) =>
                nestedSelector.flatMap((component) => {
                  if (component.type === 'nesting') {
                    return [component, { type: 'combinator', value: 'descendant' }, ...selector];
                  }

                  return component;
                })
              );
            }),
          },
        });
      } else {
        flattenedRules.push(nestedRule);
      }
    }

    return flattenedRules;
  },

  // Atomicise rules
  // TODO important handling, compressed class names
  RuleExit(rule) {
    if (rule.type !== 'style') {
      return;
    }

    const atomicRules = [];
    const {
      value: {
        declarations: { declarations },
        loc,
        selectors,
      },
    } = rule;

    for (const declaration of declarations) {
      for (const selector of selectors) {
        const atomicSelector = selector.map((part) => {
          if (part.type !== 'nesting') {
            return part;
          }

          const group = hash(JSON.stringify(selector) + declaration.property).slice(0, 4);
          const value = hash(JSON.stringify(declaration.value)).slice(0, 4);
          const name = `_${group}${value}`;

          callback?.(name);

          return {
            type: 'class',
            name,
          };
        });

        atomicRules.push({
          type: 'style',
          value: {
            declarations: {
              declarations: [declaration],
              importantDeclarations: [],
            },
            loc,
            selectors: [atomicSelector],
          },
        });
      }
    }

    return atomicRules;
  },
});
