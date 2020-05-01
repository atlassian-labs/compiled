import { hash } from '../utils/hash';

export const getTokenCssVariable = (name: string, tokenPrefix = 'cc') => {
  return `--${tokenPrefix}-${hash(name)}`;
};
