/**
 * This module will only exist in your bundle when server side rendering.
 * Make sure your bundler respected the "browser" pkg json field!
 */
import React from 'react';
import { useRef, useContext, createContext } from 'react';
import { ProviderComponent, UseCacheHook } from './types';

if (typeof window !== 'undefined') {
  throw new Error(
    `
 ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗██╗     ███████╗██████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║██║     ██╔════╝██╔══██╗
██║     ██║   ██║██╔████╔██║██████╔╝██║██║     █████╗  ██║  ██║
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║██║     ██╔══╝  ██║  ██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║███████╗███████╗██████╔╝
  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═════╝

  @compiled/css-in-js - ERROR

  This piece of code should only run on the server.
`
  );
}

const Cache = createContext<Record<string, true>>({});

export const useCache: UseCacheHook = () => {
  return useContext(Cache);
};

const Provider: ProviderComponent = (props: { children: JSX.Element[] | JSX.Element }) => {
  const inserted = useRef<Record<string, true>>(useCache());
  return <Cache.Provider value={inserted.current}>{props.children}</Cache.Provider>;
};

export default Provider;
