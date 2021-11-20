import noEmotionCSS from './rules/no-emotion-css';
import preferJSXImportSourcePragma from './rules/prefer-jsx-import-source-pragma';

export const rules = {
  'no-emotion-css': noEmotionCSS,
  'prefer-jsx-import-source-pragma': preferJSXImportSourcePragma,
};

export const configs = {
  plugins: ['@compiled'],
  recommended: {
    rules: {},
  },
};
