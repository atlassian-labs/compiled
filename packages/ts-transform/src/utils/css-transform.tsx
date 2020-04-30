import postcss, { plugin } from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano-preset-default';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';
import selectorParser from 'postcss-selector-parser';
import { TransformerOptions } from '../types';

const minify = () => {
  const preset = cssnano();
  // We exclude async because we need this to run synchronously as ts transformers aren't async!
  const asyncPluginsToExclude = ['postcss-svgo', 'postcss-normalize-charset'];

  return preset.plugins
    .map(([creator]: any) => {
      // replicate the `initializePlugin` behavior from https://github.com/cssnano/cssnano/blob/a566cc5/packages/cssnano/src/index.js#L8
      return creator();
    })
    .filter((plugin: any) => {
      return !asyncPluginsToExclude.includes(plugin.postcssPlugin);
    });
};

const isPreviousSelectorCombinatorType = (selector: selectorParser.Node) => {
  const previousSelector = selector.prev();

  return previousSelector && previousSelector.type === 'combinator';
};
const prependNestingTypeToSelector = (selector: selectorParser.Node) => {
  const { parent } = selector;

  if (parent) {
    const nesting = selectorParser.nesting();

    parent.insertBefore(selector, nesting);
  }
};
const stringifySelectorParserRoot = (parserRoot: selectorParser.Root) =>
  parserRoot.reduce<string[]>((memo, selector) => [...memo, String(selector)], []).join(',\n');
const parentOrphenedPseudos = plugin('parent-orphened-pseudos', () => {
  return (root) => {
    root.walkRules((rule) => {
      const { selector: ruleSelector } = rule;

      if (!ruleSelector.includes(':')) {
        return;
      }

      const selectorParserRoot = selectorParser((selectors) => {
        selectors.walkPseudos((selector) => {
          if (isPreviousSelectorCombinatorType(selector)) {
            return;
          }

          prependNestingTypeToSelector(selector);
        });
      }).astSync(ruleSelector, { lossless: false });

      rule.selector = stringifySelectorParserRoot(selectorParserRoot);
    });
  };
});

const extractStyleSheets = plugin<{ callback: (sheet: string) => void }>(
  'extract-style-sheets',
  (opts) => {
    return (root) => {
      root.each((node) => {
        opts?.callback(node.toString());
      });
    };
  }
);

const replaceThemedProperties = plugin<TransformerOptions>('replace-themed-properties', (opts) => {
  return (root) => {
    if (!opts || !opts.tokens) {
      return;
    }

    const tokens = opts.tokens;

    root.walkDecls(/color/, (decl) => {
      if (decl.value.includes('theme(')) {
        const match = decl.value.match(/theme\((.+)\)/);
        if (match) {
          const tokenName = match[1];
          const rawName = tokens.default[tokenName];
          decl.value = tokens.base[rawName];
        }
      }
    });
  };
});

export const transformCss = (
  selector: string,
  css: string,
  opts: TransformerOptions = { minify: false }
): string[] => {
  const sheets: string[] = [];
  const cssWithSelector = selector ? `${selector} { ${css} }` : css;

  const result = postcss([
    replaceThemedProperties(opts),
    parentOrphenedPseudos(),
    nested(),
    autoprefixer(),
    ...(opts.minify ? minify() : [whitespace]),
    extractStyleSheets({ callback: (sheet: string) => sheets.push(sheet) }),
  ]).process(cssWithSelector, {
    from: undefined,
  });

  // We need to access something to make the transformation happen.
  result.css;

  return sheets;
};
