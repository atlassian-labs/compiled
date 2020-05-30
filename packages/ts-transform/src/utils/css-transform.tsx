import postcss, { plugin } from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano-preset-default';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';
import parser from 'postcss-selector-parser';

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

const removeSpacesBeforeSelector = (selector: parser.Node) => (selector.spaces.before = '');
const doesCombinatorTypePrecedesSelector = (selector: parser.Node) => {
  const previousSelector = selector.prev();

  return previousSelector && previousSelector.type === 'combinator';
};
const prependNestingTypeToSelector = (selector: parser.Node) => {
  const { parent } = selector;

  if (parent) {
    const nesting = parser.nesting({});

    parent.insertBefore(selector, nesting);
  }
};
const parentOrphenedPseudos = plugin('parent-orphened-pseudos', () => {
  return (root) => {
    root.walkRules((rule) => {
      const parserRoot = parser((selectors) => {
        selectors.walk((selector) => {
          removeSpacesBeforeSelector(selector);

          if (selector.type === 'pseudo') {
            if (doesCombinatorTypePrecedesSelector(selector)) {
              return;
            }

            prependNestingTypeToSelector(selector);
          }
        });
      }).astSync(rule.selector);

      // TODO: Remove any typecasting once https://github.com/postcss/postcss-selector-parser/pull/224 gets merged
      rule.selector = (parserRoot as any)
        .reduce((memo: parser.Node[], selector: parser.Node) => [...memo, String(selector)], [])
        .join(',\n');
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

interface Opts {
  minify?: boolean;
}

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
