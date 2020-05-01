import { ReactNode, ComponentType } from 'react';
import { createSetupError } from '../utils/error';

interface ProviderProps {
  children: (style: {}) => ReactNode;
  mode: 'default' | (string & {});
}

export const createThemeProvider = (): ComponentType<ProviderProps> => {
  throw createSetupError();
};
