import { flatRecommended } from './configs/flat-recommended';
import { recommended } from './configs/recommended';
import { jsxPragmaRule } from './rules/jsx-pragma';
import { localCXXCSSRule } from './rules/local-cx-xcss';
import { noCssPropWithoutCssFunctionRule } from './rules/no-css-prop-without-css-function';
import { noCssTaggedTemplateExpressionRule } from './rules/no-css-tagged-template-expression';
import { noEmotionCssRule } from './rules/no-emotion-css';
import { noEmptyStyledExpressionRule } from './rules/no-empty-styled-expression';
import { noExportedCssRule } from './rules/no-exported-css';
import { noExportedKeyframesRule } from './rules/no-exported-keyframes';
import { noInvalidCssMapRule } from './rules/no-invalid-css-map';
import { noJavaScriptXCSSRule } from './rules/no-js-xcss';
import { noKeyframesTaggedTemplateExpressionRule } from './rules/no-keyframes-tagged-template-expression';
import { noStyledTaggedTemplateExpressionRule } from './rules/no-styled-tagged-template-expression';
import { noSuppressXCSS } from './rules/no-suppress-xcss';
import { shorthandFirst } from './rules/shorthand-property-sorting';

export const name = '/* NAME */';
export const version = '/* VERSION */';

export const rules = {
  'jsx-pragma': jsxPragmaRule,
  'local-cx-xcss': localCXXCSSRule,
  'no-css-prop-without-css-function': noCssPropWithoutCssFunctionRule,
  'no-css-tagged-template-expression': noCssTaggedTemplateExpressionRule,
  'no-emotion-css': noEmotionCssRule,
  'no-exported-css': noExportedCssRule,
  'no-exported-keyframes': noExportedKeyframesRule,
  'no-invalid-css-map': noInvalidCssMapRule,
  'no-js-xcss': noJavaScriptXCSSRule,
  'no-keyframes-tagged-template-expression': noKeyframesTaggedTemplateExpressionRule,
  'no-styled-tagged-template-expression': noStyledTaggedTemplateExpressionRule,
  'no-suppress-xcss': noSuppressXCSS,
  'no-empty-styled-expression': noEmptyStyledExpressionRule,
  'shorthand-property-sorting': shorthandFirst,
} as const;

export const plugin = {
  meta: {
    name,
    version,
  },
  rules,
  configs: {
    recommended,
    'flat/recommended': {
      ...flatRecommended,
      plugins: {
        get '@compiled'() {
          return plugin;
        },
      },
    },
  },
} as const;

export const configs = plugin.configs;

export default plugin;
