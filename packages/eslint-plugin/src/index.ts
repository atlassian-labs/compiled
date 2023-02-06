import { recommended } from './configs/recommended';
import { jsxPragmaRule } from './rules/jsx-pragma';
import { noCssPropWithoutCssFunctionRule } from './rules/no-css-prop-without-css-function';
import { noCssTaggedTemplateExpressionRule } from './rules/no-css-tagged-template-expression';
import { noEmotionCssRule } from './rules/no-emotion-css';
import { noExportedCssRule } from './rules/no-exported-css';
import { noExportedKeyframesRule } from './rules/no-exported-keyframes';
import { noKeyframesTaggedTemplateExpressionRule } from './rules/no-keyframes-tagged-template-expression';
import { noStyledTaggedTemplateExpressionRule } from './rules/no-styled-tagged-template-expression';

export const rules = {
  'jsx-pragma': jsxPragmaRule,
  'no-css-tagged-template-expression': noCssTaggedTemplateExpressionRule,
  'no-exported-css': noExportedCssRule,
  'no-exported-keyframes': noExportedKeyframesRule,
  'no-emotion-css': noEmotionCssRule,
  'no-keyframes-tagged-template-expression': noKeyframesTaggedTemplateExpressionRule,
  'no-styled-tagged-template-expression': noStyledTaggedTemplateExpressionRule,
  'no-css-prop-without-css-function': noCssPropWithoutCssFunctionRule,
};

export const configs = {
  recommended,
};
