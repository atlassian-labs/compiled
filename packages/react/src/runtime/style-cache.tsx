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
   */
  const ssrStyles = document.querySelectorAll<HTMLStyleElement>('style[data-cmpld]');
  for (let i = 0; i < ssrStyles.length; i++) {
    // Create the client cache for all SSR'd classes
    const stylesheet = ssrStyles[i];
    const rulesText = stylesheet.innerText;

    if (rulesText) {
      // We split the stylesheet innerText by the closing } then loop over the array
      const arr = rulesText.split('}');

      // Nested rule string
      let nestedRule = '';

      for (let i = 0; i < arr.length; i++) {
        const myRule = `${arr[i]}}`;
        // check if rule starts with @
        if (myRule.charCodeAt(0) === 64) {
          // begin building nested rule string
          nestedRule = myRule;
          // if the nested rule ends with }} then it's considered complete
        } else if (nestedRule.substr(-2) === '}}') {
          // add nested rule to Cache and reset nestedRule string
          Cache[nestedRule] = true;
          nestedRule = '';
          // if we have started building a nested rule but it is not complete then append an }
        } else if (nestedRule) {
          nestedRule += '}';
        } else {
          // if not an @ rule then just add to Cache
          Cache[myRule] = true;
        }
      }
    }

    // Move all found server-side rendered style elements to the head before React hydration happens.
    document.head.appendChild(stylesheet);
  }
}

/**
 * Hook using the cache created on the server or client.
 */
export const useCache: UseCacheHook = () => {
  if (isNodeEnvironment()) {
    // On the server we use React Context so we don't leak the cache between SSR calls.
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
  if (isNodeEnvironment()) {
    // This code path isn't conditionally called at build time - safe to ignore.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const inserted = useCache();
    return <Cache.Provider value={inserted}>{props.children}</Cache.Provider>;
  }

  return props.children as JSX.Element;
};

export default StyleCacheProvider;
