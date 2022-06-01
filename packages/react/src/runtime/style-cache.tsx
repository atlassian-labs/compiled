import * as React from 'react';
import { createContext, useContext } from 'react';

import { isCacheDisabled } from './cache';
import { isServerEnvironment } from './is-server-environment';
import type { ProviderComponent, UseCacheHook } from './types';

/**
 * Cache to hold already used styles.
 * React Context on the server - singleton object on the client.
 */
const Cache: any = isServerEnvironment() ? createContext<Record<string, true> | null>(null) : {};

if (!isServerEnvironment()) {
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
  if (isCacheDisabled()) {
    return {};
  }

  if (isServerEnvironment()) {
    // On the server we use React Context to we don't leak the cache between SSR calls.
    // During runtime this hook isn't conditionally called - it is at build time that the flow gets decided.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(Cache) || {};
  }

  // On the client we use the object singleton.
  return Cache;
};

/**
 * On the server this ensures the minimal amount of styles will be rendered
 * safely using React Context.
 *
 * On the browser this turns into a fragment with no React Context.
 */
const StyleCacheProvider: ProviderComponent = (props) => {
  if (isServerEnvironment()) {
    // This code path isn't conditionally called at build time - safe to ignore.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const inserted = useCache();
    return <Cache.Provider value={inserted}>{props.children}</Cache.Provider>;
  }

  return props.children as JSX.Element;
};

export default StyleCacheProvider;
