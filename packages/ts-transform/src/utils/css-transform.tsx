import postcss, { plugin } from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano-preset-default';
import nested from 'postcss-nested';
import whitespace from 'postcss-normalize-whitespace';
import selectorParser from 'postcss-selector-parser';
import { TransformerOptions, Tokens } from '../types';
import { CLASS_NAME_PREFIX } from '../constants';
import { getTokenCssVariable } from './theme';

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

const getPossibleTokenNameFromBaseValue = (value: string, tokens: Tokens) => {
  const baseValues = Object.values(tokens.base);
  const baseIndex = baseValues.indexOf(value);
  if (baseIndex >= 0) {
    const baseKeyName = Object.keys(tokens.base)[baseIndex];
    const defaultValues = Object.values(tokens.default);
    const defaultIndex = defaultValues.indexOf(baseKeyName);
    const defaultKeyName = Object.keys(tokens.default)[defaultIndex];

    return {
      name: defaultKeyName,
      confidence: 100,
    };
  }

  return undefined;
};

const replaceThemedProperties = plugin<TransformerOptions>('replace-themed-properties', (opts) => {
  return (root) => {
    if (!opts || !opts.tokens) {
      return;
    }

    const tokenPrefix = opts.tokenPrefix || CLASS_NAME_PREFIX;
    const tokens = opts.tokens;
    const errors: string[] = [];

    root.walkDecls(/color/, (decl) => {
      if (decl.value.includes('theme(')) {
        const match = decl.value.match(/theme\((.+)\)/);
        if (match) {
          const tokenName = match[1];
          const rawName = tokens.default[tokenName];
          decl.value = getTokenCssVariable(tokenName, {
            tokenPrefix,
            defaultValue: tokens.base[rawName],
            useVariable: true,
          });
        }
      } else if (opts.strict) {
        let errorMessage = `"${decl.toString()};"`;
        const possibleTokenName = getPossibleTokenNameFromBaseValue(decl.value, tokens);
        if (possibleTokenName) {
          errorMessage += ` - replace ${decl.value} with theme(${possibleTokenName.name}).`;
        }

        errors.push(errorMessage);
      }
    });

    if (errors.length) {
      throw new Error(
        `You've defined hard-coded colors which is not allowed in strict mode.
${errors.join('\n')}`
      );
    }
  };
});

export const transformCss = (
  selector: string,
  css: string,
  opts: TransformerOptions = {}
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
