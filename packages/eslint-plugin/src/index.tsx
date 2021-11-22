import jsxPragma from './rules/jsx-pragma';
import noEmotionCSS from './rules/no-emotion-css';

export const rules = {
  'no-emotion-css': noEmotionCSS,
  'jsx-pragma': jsxPragma,
};

export const configs = {
  plugins: ['@compiled'],
  recommended: {
    rules: {},
  },
};
