import { recommended } from './configs/recommended';
import { jsxPragmaRule } from './rules/jsx-pragma';
import { noCssTaggedTemplateExpressionRule } from './rules/no-css-tagged-template-expression';
import { noEmotionCssRule } from './rules/no-emotion-css';
import { noKeyframesTaggedTemplateExpressionRule } from './rules/no-keyframes-tagged-template-expression';
import { noStyledTaggedTemplateExpressionRule } from './rules/no-styled-tagged-template-expression';

export const rules = {
  'jsx-pragma': jsxPragmaRule,
  'no-css-tagged-template-expression': noCssTaggedTemplateExpressionRule,
  'no-emotion-css': noEmotionCssRule,
  'no-keyframes-tagged-template-expression': noKeyframesTaggedTemplateExpressionRule,
  'no-styled-tagged-template-expression': noStyledTaggedTemplateExpressionRule,
};

export const configs = {
  recommended,
};
