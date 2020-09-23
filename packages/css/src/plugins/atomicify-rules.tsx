import { plugin, Node, Declaration, decl, Container, rule, Rule, AtRule } from 'postcss';
import { hash } from '@compiled/utils';

interface PluginOpts {
  callback?: (className: string) => void;
}

interface AtomicifyOpts extends PluginOpts {
  selectors?: string[];
  atRule?: string;
  parentNode?: Container;
}

/**
 * Returns an atomic rule class name using this form:
 *
 * ```
 * "_{atrules}{selectors}{propertyname}"
 * ```
 *
 * Atomic rules are always prepended with an underscore.
 *
 * @param group
 * @param value
 */
const atomicClassName = (propName: string, value: string, opts: AtomicifyOpts) => {
  const selectors = opts.selectors ? opts.selectors.join('') : '';
  const group = hash(`${opts.atRule}${selectors}${propName}`).slice(0, 4);
  const valueHash = hash(value).slice(0, 4);

  return `_${group}${valueHash}`;
};

/**
 * Returns a normalized selector.
 * This will handle immediate dangling pseudos `:` as well as the nesting operator `&`.
 *
 * @param selector
 */
const normalizeSelector = (selector: string | undefined) => {
  if (!selector) {
    // Nothing to see here - return early with an empty string!
    return '';
  }

  // We want to build a consistent selector that we will use to generate the group hash.
  // Because of that we trim whitespace as well as removing any top level nesting "&".
  const trimmed = selector.trim();

  switch (trimmed.charAt(0)) {
    case ':':
      // Dangling pseudo - return immedately!
      return trimmed;

    case '&':
      // Dangling nesting - replace it and return!
      return trimmed.replace('&', '');

    default:
      // Must be a nested selector - add a space before it!
      return ` ${trimmed}`;
  }
};

/**
 * Replaces all instances of a nesting operator `&` with the parent class name.
 *
 * @param selector
 * @param parentClassName
 */
const replaceNestingSelector = (selector: string, parentClassName: string) => {
  return selector.replace(/ &/g, ` .${parentClassName}`);
};

/**
 * Builds an atomic rule selector.
 *
 * @param node
 */
const buildAtomicSelector = (node: Declaration, opts: AtomicifyOpts) => {
  const selectors: string[] = [];

  (opts.selectors || ['']).forEach((selector) => {
    const normalizedSelector = normalizeSelector(selector);
    const className = atomicClassName(node.prop, node.value, {
      ...opts,
      selectors: [normalizedSelector],
    });
    const replacedSelector = replaceNestingSelector(normalizedSelector, className);

    selectors.push(`.${className}${replacedSelector}`);

    if (opts.callback) {
      opts.callback(className);
    }
  });

  return selectors.join(', ');
};

/**
 * Transforms a declaration into an atomic rule.
 *
 * @param node
 * @param opts
 */
const atomicifyDecl = (node: Declaration, opts: AtomicifyOpts) => {
  const selector = buildAtomicSelector(node, opts);
  const newDecl = decl({ prop: node.prop, value: node.value });
  const newRule = rule({ selector, nodes: [newDecl] });

  // We need to link the new node to a parent else autoprefixer blows up.
  newDecl.parent = opts.parentNode || newRule;
  newDecl.raws.before = '';
  // newRule.parent = opts.parentNode!;

  return newRule;
};

/**
 * Transforms a rule into atomic rules.
 *
 * @param node
 * @param opts
 */
const atomicifyRule = (node: Rule, opts: AtomicifyOpts) => {
  if (!node.nodes) {
    return [];
  }

  return node.nodes.map((childNode) => {
    if (childNode.type !== 'decl') {
      throw childNode.error(`Nested ${childNode.type}s are not allowed.`);
    }

    return atomicifyDecl(childNode, {
      ...opts,
      selectors: node.selectors,
    });
  });
};

/**
 * Transforms an atrule into atomic rules.
 *
 * @param node
 * @param opts
 */
const atomicifyAtRule = (node: AtRule, opts: AtomicifyOpts): AtRule => {
  let children: Node[] = [];
  const atRuleLabel = `${opts.atRule || ''}${node.name}${node.params}`;
  const atRuleOpts = {
    ...opts,
    parentNode: node,
    atRule: atRuleLabel,
  };

  node.each((childNode) => {
    switch (childNode.type) {
      case 'atrule':
        children.push(atomicifyAtRule(childNode, atRuleOpts));
        break;

      case 'rule':
        children = children.concat(atomicifyRule(childNode, atRuleOpts));
        break;

      case 'decl':
        children.push(atomicifyDecl(childNode, atRuleOpts));
        break;

      default:
        break;
    }
  });

  return node.clone({ nodes: children });
};

/**
 * Transforms a style sheet into atomic rules.
 * When passing a `callback` option it will callback with created class names.
 *
 * Preconditions:
 *
 * 1. No nested rules allowed - normalize them with the `parent-orphaned-pseudos` and `nested` plugins first.
 */
export const atomicifyRules = plugin<PluginOpts>('atomicify-rules', (opts = {}) => {
  return (root) => {
    root.each((node) => {
      switch (node.type) {
        case 'atrule':
          node.replaceWith(atomicifyAtRule(node, {}));
          break;

        case 'rule':
          node.replaceWith(atomicifyRule(node, opts));
          break;

        case 'decl':
          node.replaceWith(atomicifyDecl(node, opts));
          break;

        default:
          break;
      }
    });
  };
});
