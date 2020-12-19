import * as React from 'react';
import { createContext, useContext } from 'react';
import { isNodeEnvironment } from './is-node';
import { ProviderComponent, UseCacheHook } from './types';

/**
 * Cache to hold already used styles.
 * React Context on the server - singleton object on the client.
 */
const Cache: any = isNodeEnvironment() ? createContext<Record<string, true> | null>(null) : {};

if (!isNodeEnvironment()) {
  /**
   * Iterates through all found style elements generated when server side rendering.
   *
   * @param cb
   */
  const ssrStyles = document.querySelectorAll<HTMLStyleElement>('style[data-cmpld]');
  for (let i = 0; i < ssrStyles.length; i++) {
    // Move all found server-side rendered style elements to the head before React hydration happens.
    document.head.appendChild(ssrStyles[i]);
  }
}

/**
 * Hook using the cache created on the server or client.
 */
export const useCache: UseCacheHook = () => {
  if (isNodeEnvironment()) {
    // This code path isn't conditionally called at build time - safe to ignore.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(Cache) || {};
  }

  return Cache;
};

/**
 * On the server this ensures the minimal amount of styles will be rendered
 * safely using React Context.
 *
 * On the browser this turns into a fragment with no React Context.
 */
const StyleCacheProvider: ProviderComponent = (props) => {
  if (isNodeEnvironment()) {
    // This code path isn't conditionally called at build time - safe to ignore.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const inserted = useCache();
    return <Cache.Provider value={inserted}>{props.children}</Cache.Provider>;
  }

  return props.children as JSX.Element;
};

export default StyleCacheProvider;
