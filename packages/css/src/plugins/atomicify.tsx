import { plugin, rule, AtRule, Rule, decl, atRule, Declaration } from 'postcss';
import { hash } from '@compiled/utils';

interface Opts {
  parentSelector?: string;
  parentAtRule?: string;
  callback?: (className: string) => void;
}

const join = (...str: (string | undefined)[]) => {
  if (!str) {
    return '';
  }

  return str
    .filter(Boolean)
    .map((inner) => inner!.replace(' ', '___').replace(/&/g, ''))
    .join('');
};

const normalizeSelector = (str?: string) => {
  if (!str) {
    return '';
  }

  return str.charAt(0) === '&' ? str.replace(/^&+/, '') : ` ${str}`;
};

const fixClassName = (str: string) => {
  if (Number.isFinite(+str.charAt(0))) {
    return `_${str}`;
  }

  return str;
};

const atomicifyDecl = (node: Declaration, opts: Opts = {}) => {
  const normalizedSelector = normalizeSelector(opts.parentSelector);
  const group = hash(`${join(opts.parentAtRule, opts.parentSelector)}${node.prop}`).slice(0, 4);
  const className = fixClassName(`${group}${hash(node.value).slice(0, 4)}`);
  const selector = `.${className}${normalizedSelector}`;
  const newDecl = decl({ prop: node.prop, value: node.value });
  const newRule = rule({ selector, nodes: [newDecl] });
  newDecl.parent = newRule;

  if (opts.callback) {
    opts.callback(className);
  }

  return newRule;
};

const atomicifyRule = (node: Rule, opts: Opts = {}) => {
  if (!node.nodes) {
    return [];
  }

  return node.nodes.map((childNode) => {
    if (childNode.type !== 'decl') {
      throw new Error('Only decls are allowed inside a rule.');
    }

    return atomicifyDecl(childNode, {
      ...opts,
      parentSelector: node.selector,
    });
  });
};

const atomicifyAtRule = (node: AtRule, opts: Opts = {}) => {
  if (!node.nodes) {
    return [];
  }

  const normalizedName = `${node.name}${node.params.replace(/ /g, '')}`;

  const childNodes = node.nodes.map((childNode) => {
    if (childNode.type === 'rule') {
      return atomicifyRule(childNode, { ...opts, parentAtRule: normalizedName });
    }

    if (childNode.type === 'decl') {
      return atomicifyDecl(childNode, { ...opts, parentAtRule: normalizedName });
    }

    throw new Error();
  });

  return atRule({
    name: node.name,
    params: node.params,
    nodes: childNodes.reduce<Rule[]>((acc, val) => acc.concat(val), []),
  });
};

export const atomicify = plugin<{ callback?: (className: string) => void }>(
  'parent-orphened-pseudos',
  (opts) => {
    return (root) => {
      root.walk((node) => {
        switch (node.type) {
          case 'atrule':
            node.replaceWith(atomicifyAtRule(node, { callback: opts?.callback }));
            break;

          case 'rule':
            node.replaceWith(atomicifyRule(node, { callback: opts?.callback }));
            break;

          case 'decl':
            node.replaceWith(atomicifyDecl(node, { callback: opts?.callback }));
            break;

          default:
            break;
        }
      });
    };
  }
);
