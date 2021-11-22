import jsxPragma from './rules/jsx-pragma';
import noEmotionCSS from './rules/no-emotion-css';

export const rules = {
  'jsx-pragma': jsxPragma,
  'no-emotion-css': noEmotionCSS,
};

export const configs = {
  plugins: ['@compiled'],
  recommended: {
    rules: {},
  },
};
