import postcss, { plugin } from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano-preset-default';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';
import selectorParser from 'postcss-selector-parser';

/**
 * PostCSS `cssnano` plugin to minify CSS.
 * It deliberately excludes some plugins so it is forced to be synchronous.
 */
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

const stringifySelectorParserRoot = (parserRoot: selectorParser.Root) => {
  return parserRoot
    .reduce<string[]>((memo, selector) => [...memo, String(selector)], [])
    .join(',\n');
};

/**
 * Parent orphened pseudos PostCSS plugin.
 * This plugin will move child nested orphened pseudos to the parent declaration.
 *
 * E.g: `.class { &:hover {} }` will become `.class:hover {}`
 */
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

/**
 * PostCSS plugin which will callback when traversing through each root declaration.
 */
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

interface Opts {
  /**
   * Enables minifying CSS through `cssnano`.
   */
  minify?: boolean;
}

/**
 * Will transform CSS into multiple CSS sheets.
 *
 * @param selector CSS selector such as `.class`
 * @param css CSS string
 * @param opts Transformation options
 */
export const transformCss = (
  selector: string,
  css: string,
  opts: Opts = { minify: false }
): string[] => {
  const sheets: string[] = [];
  const cssWithSelector = selector ? `${selector} { ${css} }` : css;

  const result = postcss([
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
