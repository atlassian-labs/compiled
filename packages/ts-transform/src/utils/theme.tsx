import { hash } from '../utils/hash';

interface Opts {
  defaultValue?: string;
  tokenPrefix?: string;
  useVariable?: boolean;
}

export const getTokenCssVariable = (
  name: string,
  { defaultValue, tokenPrefix = 'cc', useVariable }: Opts = {}
) => {
  const value = `--${tokenPrefix}-${hash(name)}`;

  if (useVariable || defaultValue) {
    return `var(${value}${defaultValue ? `,${defaultValue}` : ''})`;
  }

  return value;
};
