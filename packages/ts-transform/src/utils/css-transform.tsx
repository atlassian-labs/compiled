import postcss, { plugin } from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano-preset-default';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';

const minify = () => {
  const preset = cssnano();
  const asyncPluginsToExclude = ['postcss-svgo'];

  return preset.plugins
    .map(([creator]: any) => {
      // replicate the `initializePlugin` behavior from https://github.com/cssnano/cssnano/blob/a566cc5/packages/cssnano/src/index.js#L8
      return creator();
    })
    .filter((plugin: any) => {
      return !asyncPluginsToExclude.includes(plugin.postcssPlugin);
    });
};

const topLevelPseudos = plugin('top-level-pseudos', () => {
  return root => {
    root.each(node => {
      if (node.type === 'rule') {
        node.nodes &&
          node.nodes.forEach(rule => {
            if (rule.type === 'rule' && rule.selector.startsWith(':')) {
              rule.selector = `&${rule.selector}`;
            }

            if (rule.type === 'atrule' && (rule.name === 'media' || rule.name === 'supports')) {
              rule.nodes?.forEach(ruleInMedia => {
                if (ruleInMedia.type === 'rule' && ruleInMedia.selector.startsWith(':')) {
                  ruleInMedia.selector = `&${ruleInMedia.selector}`;
                }
              });
            }
          });
      }
    });
  };
});

const extractStyleSheets = plugin<{ callback: (sheet: string) => void }>(
  'extract-style-sheets',
  opts => {
    return root => {
      root.each(node => {
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
    topLevelPseudos(),
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
