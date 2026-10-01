import type { AtRule, ChildNode, Container, Rule } from 'postcss';
import postcss from 'postcss';

const NESTED_AT_RULES = /^(?:media|supports|container|layer)$/i;
const LEADING_CLASS = /^\.((?:\\.|[\w-])+)/;

const leadingClass = (selector: string): string | undefined =>
  selector.trim().match(LEADING_CLASS)?.[1];

/**
 * Records the class names declared by a pre-built `.compiled.css` file.
 *
 * @param css - The contents of one `.compiled.css` file
 * @param into - The set to add the leading class of every selector to
 */
export const collectAtomicClassNames = (css: string, into: Set<string>): void => {
  postcss.parse(css).walkRules((rule) => {
    for (const selector of rule.selectors) {
      const name = leadingClass(selector);
      if (name) {
        into.add(name);
      }
    }
  });
};

const isAtomicRule = (rule: Rule, atomicClassNames: ReadonlySet<string>): boolean =>
  rule.selectors.length > 0 &&
  rule.selectors.every((selector) => {
    const name = leadingClass(selector);
    return name !== undefined && atomicClassNames.has(name);
  });

const isAtomicAtRule = (atRule: AtRule, atomicClassNames: ReadonlySet<string>): boolean => {
  const children = (atRule.nodes ?? []).filter((child) => child.type !== 'comment');

  return (
    children.length > 0 &&
    children.every(
      (child) =>
        (child.type === 'rule' && isAtomicRule(child, atomicClassNames)) ||
        (child.type === 'atrule' &&
          NESTED_AT_RULES.test(child.name) &&
          isAtomicAtRule(child, atomicClassNames))
    )
  );
};

const sortContainer = (
  container: Container,
  atomicClassNames: ReadonlySet<string>,
  sortCss: (css: string) => string
): void => {
  const atomicNodes: ChildNode[] = [];

  for (const node of [...(container.nodes ?? [])]) {
    if (node.type === 'rule' && isAtomicRule(node, atomicClassNames)) {
      atomicNodes.push(node);
    } else if (node.type === 'atrule' && NESTED_AT_RULES.test(node.name)) {
      if (isAtomicAtRule(node, atomicClassNames)) {
        atomicNodes.push(node);
      } else {
        // An at-rule mixing atomic and other rules keeps its place; only its atomic
        // children are sorted.
        sortContainer(node, atomicClassNames, sortCss);
      }
    }
  }

  if (atomicNodes.length < 2) {
    return;
  }

  // `sort()` orders the sheet before merging duplicate at-rules, so the contents of
  // merged at-rules are only ordered by a second pass.
  const sorted = postcss.parse(sortCss(sortCss(atomicNodes.map(String).join('\n')))).nodes;
  const [first, ...rest] = atomicNodes;

  for (const node of rest) {
    node.remove();
  }
  first.replaceWith(...sorted.map((node) => node.clone()));
};

/**
 * Sorts only the atomic rules whose classes were declared by `.compiled.css`
 * files. They are sorted together and put back as one block where the first of
 * them was; every other rule keeps its position and is never passed to `sortCss`.
 *
 * @param css - A CSS asset from the bundle
 * @param atomicClassNames - Class names collected with `collectAtomicClassNames`
 * @param sortCss - Compiled's sort, with the plugin's sort options applied
 */
export const sortAtomicRulesOnly = (
  css: string,
  atomicClassNames: ReadonlySet<string>,
  sortCss: (css: string) => string
): string => {
  if (atomicClassNames.size === 0) {
    return css;
  }

  const root = postcss.parse(css);
  sortContainer(root, atomicClassNames, sortCss);

  return root.toString();
};
