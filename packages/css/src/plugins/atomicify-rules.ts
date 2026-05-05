import { hash } from '@compiled/utils';
import type { Plugin, ChildNode, Declaration, Container, Rule, AtRule } from 'postcss';
import { rule } from 'postcss';
import selectorParser from 'postcss-selector-parser';

interface PluginOpts {
  classNameCompressionMap?: Record<string, string>;
  callback?: (className: string) => void;
  selectors?: string[];
  atRule?: string;
  parentNode?: Container;
  classHashPrefix?: string;
  group?: boolean;
}

/**
 * Returns true if a given string is a valid CSS identifier
 *
 * @param value the value to test
 * @returns `true` if given value is valid, `false` if not
 *
 */
const isCssIdentifierValid = (value: string): boolean => {
  const validCssIdentifierRegex = /^[a-zA-Z\-_]+[a-zA-Z\-_0-9]*$/;
  return validCssIdentifierRegex.test(value);
};

/**
 * Checks whether selector contains combinators: " ", " > ", " + ", " ~ "
 *
 * @param value the value to test
 * @returns boolean
 */
const isSelectorWithCombinator = (value: string): boolean => {
  let seenCombinator = false;
  selectorParser((selectors) => {
    // Only inspect top-level selectors — do not descend into pseudo-function
    // arguments (e.g. `:not(.a + .b)`) where combinators are scoped to the
    // pseudo and do not represent actual parent–child / sibling relationships
    // in the rule's selector.
    selectors.each((selector) => {
      for (const node of selector.nodes) {
        if (selectorParser.isCombinator(node)) {
          seenCombinator = true;
          return false;
        }
      }
      return;
    });
  }).processSync(value);

  return seenCombinator;
};

/**
 * Returns an atomic rule class name using this form:
 *
 * ```
 * "_{atrulesselectorspropertyname}{propertyvalueimportant}"
 * ```
 *
 * Atomic rules are always prepended with an underscore.
 *
 * @param node CSS declaration
 * @param opts AtomicifyOpts
 */
type DeclarationKey = Pick<Declaration, 'prop' | 'value'> & {
  important?: Declaration['important'];
};

const atomicClassName = (node: DeclarationKey, opts: PluginOpts) => {
  const selectors = opts.selectors ? opts.selectors.join('') : '';
  const prefix = opts.classHashPrefix ?? '';
  const group = hash(`${prefix}${opts.atRule}${selectors}${node.prop}`).slice(0, 4);

  const value = node.important ? node.value + node.important : node.value;
  const valueHash = hash(value).slice(0, 4);

  return `_${group}${valueHash}`;
};

/**
 * Returns a normalized selector.
 * The primary function is to get rid of white space and to place a nesting selector if one is missing.
 * If the selector already has a nesting selector - we won't do anything to it.
 *
 * ---
 * ASSUMPTION: Nesting and parent orphaned pseudos plugins should run before the atomicify plugin!
 * ---
 *
 * @param selector
 */
const normalizeSelector = (selector: string | undefined) => {
  if (!selector) {
    // Nothing to see here - return early with a nesting selector!
    return '&';
  }

  // We want to build a consistent selector that we will use to generate the group hash.
  // Because of that we trim whitespace.
  const trimmed = selector.trim();
  if (trimmed.indexOf('&') === -1) {
    return `& ${trimmed}`;
  }

  return trimmed;
};

/**
 * Replaces all instances of a nesting operator `&` with the parent class name.
 *
 * @param selector
 * @param parentClassName
 */
const replaceNestingSelector = (selector: string, parentClassName: string) => {
  return selector.replace(/&/g, `.${parentClassName}`);
};

/**
 * Builds an atomic rule selector.
 *
 * @param node
 */
const buildAtomicSelector = (node: DeclarationKey, opts: PluginOpts) => {
  const { classNameCompressionMap } = opts;
  const selectors: string[] = [];

  (opts.selectors || ['']).forEach((selector) => {
    const normalizedSelector = normalizeSelector(selector);
    const fullClassName = atomicClassName(node, {
      ...opts,
      selectors: [normalizedSelector],
    });

    const compressedClassName =
      classNameCompressionMap && classNameCompressionMap[fullClassName.slice(1)];

    if (compressedClassName) {
      // Use compressed class name if compressedClassName is available
      selectors.push(replaceNestingSelector(normalizedSelector, compressedClassName));
    } else {
      selectors.push(replaceNestingSelector(normalizedSelector, fullClassName));
    }

    if (opts.callback) {
      opts.callback(fullClassName);
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
const atomicifyDecl = (node: Declaration, opts: PluginOpts) => {
  const selector = buildAtomicSelector(node, opts);
  const newDecl = node.clone({
    raws: { before: '', value: { value: '', raw: '' }, between: '' },
  });
  const newRule = rule({
    raws: { before: '', after: '', between: '', selector: { raw: '', value: '' } },
    nodes: [newDecl],
    selector,
  });

  // We need to link the new node to a parent else autoprefixer blows up.
  newDecl.parent = newRule;
  newRule.parent = opts.parentNode!;

  return newRule;
};

/**
 * Transforms a rule into atomic rules.
 *
 * @param node
 * @param opts
 */
const atomicifyRule = (node: Rule, opts: PluginOpts): Rule[] => {
  if (!node.nodes) {
    return [];
  }

  return node.nodes
    .map((childNode) => {
      if (childNode.type === 'rule') {
        throw childNode.error(
          'Nested rules need to be flattened first - run the "postcss-nested" plugin before this.'
        );
      }

      if (childNode.type !== 'decl') {
        return undefined;
      }

      return atomicifyDecl(childNode, {
        ...opts,
        selectors: node.selectors,
      });
    })
    .filter((child): child is Rule => !!child);
};

/**
 * Builds a synthetic `Declaration`-shaped key that represents the entire
 * group of declarations under a single combinator-rule. The key is fed into
 * the existing `atomicClassName`/`buildAtomicSelector` pipeline so the
 * generated class name hashes over **all** declarations rather than only the
 * first one.
 */
const buildGroupedHashKey = (decls: Declaration[]): DeclarationKey => {
  const props = decls.map((d) => d.prop).join(';');
  const values = decls.map((d) => `${d.value}${d.important ? '!' : ''}`).join(';');
  return { prop: props, value: values };
};

/**
 * Opt-in optimisation (via `group: true`) for rules whose selector
 * contains a CSS combinator (descendant, child `>`, adjacent sibling `+`,
 * general sibling `~`). Instead of splitting into one atomic class per
 * declaration, all declarations are emitted under a single class.
 *
 * Example:
 * ```css
 * div span { color: red; font-weight: bold; }
 * ```
 *
 * `atomicifyRule` result (default):
 * ```css
 * ._hash1 div span { font-weight: bold; }
 * ._hash2 div span { color: red; }
 * ```
 *
 * `atomicifyRuleGrouped` result:
 * ```css
 * ._hash1 div span { color: red; font-weight: bold; }
 * ```
 *
 * **Runtime composition trade-off:** Compiled's runtime (`ax`, `ac`) assumes
 * atomic class names — one class per (atRule + selectors + property). A
 * grouped class breaks that invariant. If two components both emit a grouped
 * rule for the same combinator selector but with different declarations,
 * both classes survive `ax()` (they carry different group hashes) and the
 * CSS cascade — not atomic "last wins" — determines the final style. This
 * means per-property overrides are **not** possible for grouped rules.
 *
 * @param node  The PostCSS `Rule` to group.
 * @param opts  Plugin options forwarded from `atomicifyRules`.
 */
const atomicifyRuleGrouped = (node: Rule, opts: PluginOpts = {}): Rule[] => {
  if (!node.nodes) {
    return [];
  }

  for (const child of node.nodes) {
    if (child.type === 'rule') {
      throw child.error(
        'Nested rules need to be flattened first - run the "postcss-nested" plugin before this.'
      );
    }
  }

  const decls = node.nodes.filter((child): child is Declaration => child.type === 'decl');

  if (decls.length === 0) {
    return [];
  }

  const groupedKey = buildGroupedHashKey(decls);

  return node.selectors.map((branchSelector) => {
    const selector = buildAtomicSelector(groupedKey, {
      ...opts,
      selectors: [branchSelector],
    });

    const newRule = rule({
      raws: { before: '', after: '', between: '', selector: { raw: '', value: '' } },
      selector,
    });

    const newDecls = decls.map((decl) => {
      const newDecl = decl.clone({
        raws: { before: '', value: { value: '', raw: '' }, between: '' },
      });
      newDecl.parent = newRule;
      return newDecl;
    });

    newRule.parent = opts.parentNode!;
    newRule.nodes = newDecls;

    return newRule;
  });
};

/**
 * Checks whether the given at-rule node can be
 * atomicified (transformed into atomic rules).
 *
 * Throws an error for unknown at-rules, as well as
 * at-rules that should not be used in the stylesheet.
 *
 * @param node
 */
const canAtomicifyAtRule = (node: AtRule): boolean => {
  const canBeAtomificied = [
    'container',
    '-moz-document',
    'else',
    'layer',
    'media',
    'starting-style',
    'supports',
    'when',
  ];
  const forbidden = ['charset', 'import', 'namespace'];
  const ignored = [
    'color-profile',
    'counter-style',
    'font-face',
    'font-palette-values',
    'keyframes',
    'page',
    'position-try',
    'property',
  ];

  if (canBeAtomificied.includes(node.name)) {
    return true;
  } else if (forbidden.includes(node.name)) {
    throw new Error(`At-rule '@${node.name}' cannot be used in CSS rules.`);
  } else if (!ignored.includes(node.name)) {
    throw new Error(`Unknown at-rule '@${node.name}'.`);
  }

  return false;
};

/**
 * Transforms an atrule into atomic rules.
 *
 * @param node
 * @param opts
 */
const atomicifyAtRule = (node: AtRule, opts: PluginOpts): AtRule => {
  const children: ChildNode[] = [];
  const newNode = node.clone({
    raws: {
      before: '',
      between: '',
      semicolon: false,
      params: { raw: '', value: '' },
    },
    nodes: children,
  });
  const atRuleLabel = `${opts.atRule || ''}${node.name}${node.params}`;
  const atRuleOpts = {
    ...opts,
    parentNode: newNode,
    atRule: atRuleLabel,
  };

  newNode.parent = opts.parentNode!;

  node.each((childNode) => {
    switch (childNode.type) {
      case 'atrule':
        if (canAtomicifyAtRule(childNode)) {
          newNode.nodes.push(atomicifyAtRule(childNode, atRuleOpts));
        } else {
          newNode.nodes.push(childNode);
        }

        break;

      case 'rule':
        if (opts.group && isSelectorWithCombinator(childNode.selector)) {
          newNode.nodes.push(...atomicifyRuleGrouped(childNode, atRuleOpts));
          break;
        }
        atomicifyRule(childNode, atRuleOpts).forEach((rule) => {
          newNode.nodes.push(rule);
        });
        break;

      case 'decl':
        newNode.nodes.push(atomicifyDecl(childNode, atRuleOpts));
        break;

      default:
        break;
    }
  });

  return newNode;
};

/**
 * Transforms a style sheet into atomic rules.
 * When passing a `callback` option it will callback with created class names.
 *
 * Preconditions:
 *
 * 1. No nested rules allowed - normalize them with the `parent-orphaned-pseudos` and `nested` plugins first.
 *
 * @throws Throws an error if `opts.classHashPrefix` contains invalid css class/id characters
 */
export const atomicifyRules = (opts: PluginOpts = {}): Plugin => {
  if (opts.classHashPrefix && !isCssIdentifierValid(opts.classHashPrefix)) {
    throw new Error(
      `${opts.classHashPrefix} isn't a valid CSS identifier. Accepted characters are ^[a-zA-Z\-_]+[a-zA-Z\-_0-9]*$`
    );
  }

  return {
    postcssPlugin: 'atomicify-rules',
    OnceExit(root) {
      root.each((node) => {
        switch (node.type) {
          case 'atrule':
            if (canAtomicifyAtRule(node)) {
              node.replaceWith(atomicifyAtRule(node, opts));
            }
            break;

          case 'rule':
            if (opts.group && node.selectors.some(isSelectorWithCombinator)) {
              node.replaceWith(atomicifyRuleGrouped(node, opts));
              break;
            }
            node.replaceWith(atomicifyRule(node, opts));
            break;

          case 'decl':
            node.replaceWith(atomicifyDecl(node, opts));
            break;

          case 'comment':
            node.remove();
            break;

          default:
            break;
        }
      });
    },
  };
};

export const postcss = true;
