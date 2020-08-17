import React, { useRef, useContext, createContext } from 'react';
import { ProviderComponent, UseCacheHook } from './types';

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  throw new Error(
    `
 ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗██╗     ███████╗██████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║██║     ██╔════╝██╔══██╗
██║     ██║   ██║██╔████╔██║██████╔╝██║██║     █████╗  ██║  ██║
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║██║     ██╔══╝  ██║  ██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║███████╗███████╗██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═════╝

  @compiled/runtime - ERROR

  This code should only run on the server. You might need to configure your bunder to respect the "browser" field in package json.
`
  );
}

// We don't set this to an empty object else it will act like a singleton.
const Cache = createContext<Record<string, true> | null>(null);

export const useCache: UseCacheHook = () => {
  return useContext(Cache) || {};
};

const CompiledComponent: ProviderComponent = (props: { children: JSX.Element[] | JSX.Element }) => {
  const inserted = useRef<Record<string, true>>(useCache());
  return <Cache.Provider value={inserted.current}>{props.children}</Cache.Provider>;
};

export default CompiledComponent;
