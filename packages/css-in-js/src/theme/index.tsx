import { ReactNode, ComponentType } from 'react';
import { createSetupError } from '../utils/error';

type BaseTokens = Record<'base' | 'default', { [key: string]: string | number }>;

interface ProviderProps<TTokens extends BaseTokens> {
  children: (style: {}) => ReactNode;
  mode: keyof Omit<TTokens, 'base'>;
}

interface ThemeProviderReturn<TTokens extends BaseTokens> {
  ThemeProvider: ComponentType<ProviderProps<TTokens>>;
  theme: TTokens['default'];
}

export const createThemeProvider = <TTokens extends BaseTokens>(): ThemeProviderReturn<TTokens> => {
  throw createSetupError();
};
