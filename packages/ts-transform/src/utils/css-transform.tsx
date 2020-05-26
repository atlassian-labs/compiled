import postcss, { plugin } from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano-preset-default';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';

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

const COMMA_CHAR_CODE = 58;

const parentOrphenedPseudos = plugin('parent-orphened-pseudos', () => {
  return (root) => {
    root.walkRules((rule) => {
      if (rule.selector.includes(':')) {
        const newSelector = rule.selector
          .replace(/\s+/g, ' ')
          .split(', ')
          .map((part) => {
            if (part.match(/^. /)) {
              // If the selector has one characters with a space after it, e.g. "> :first-child" then return early.
              return part;
            }

            if (part.charCodeAt(0) === COMMA_CHAR_CODE) {
              // If the selector starts with a colon prepend an "&"!
              return part.replace(/^:| :/g, '&:');
            }

            // Nothing to do - cya!
            return part;
          })
          .join(',\n');

        rule.selector = newSelector;
      }
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
    autoprefixer({
      overrideBrowserslist: ['IE 11', '> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead'],
    }),
    ...(opts.minify ? minify() : [whitespace]),
    extractStyleSheets({ callback: (sheet: string) => sheets.push(sheet) }),
  ]).process(cssWithSelector, {
    from: undefined,
  });

  // We need to access something to make the transformation happen.
  result.css;

  return sheets;
};
