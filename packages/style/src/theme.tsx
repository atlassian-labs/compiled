import React, { createContext } from 'react';

const Theme = createContext<string>('default');

interface CompiledThemeProps<TTheme> {
  theme: Extract<keyof TTheme, 'string'>;
  children: React.ReactNode;
}

/**
 * Only used to tell children what the current them is that we're on.
 * Defaults to "default".
 */
export default function CT<TTheme extends {}>(props: CompiledThemeProps<TTheme>) {
  return <Theme.Provider value={props.theme}>{props.children}</Theme.Provider>;
}
