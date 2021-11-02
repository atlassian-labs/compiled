import emotionToCompiled from './rules/emotion-to-compiled';

export const rules = {
  'emotion-to-compiled': emotionToCompiled,
};

export const configs = {
  plugins: ['@compiled'],
  recommended: {
    rules: {},
  },
};
