import { ReactNode, ComponentType } from 'react';
import { createSetupError } from '../utils/error';

type BaseTokens = Record<'base' | 'default', { [key: string]: string | number }>;

interface ProviderProps<TTokens extends BaseTokens> {
  children: (style: {}) => ReactNode;
  mode: keyof Omit<TTokens, 'base'>;
}

export const createThemeProvider = <TTokens extends BaseTokens>(): ComponentType<
  ProviderProps<TTokens>
> => {
  throw createSetupError();
};
