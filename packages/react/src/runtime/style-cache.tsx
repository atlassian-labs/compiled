import * as React from 'react';
import { createContext, useContext } from 'react';
import { isNodeEnvironment } from './is-node';
import insertRule from './sheet';
import { ProviderComponent, UseCacheHook } from './types';

/**
 * Cache to hold already used styles.
 * React Context on the server - singleton object on the client.
 */
let Cache: any = isNodeEnvironment() ? createContext<Record<string, true> | null>(null) : {};

if (!isNodeEnvironment()) {
  const ssrCache = document.querySelector('script[data-cmpld="c"]');
  if (ssrCache) {
    try {
      Cache = { ...Cache, ...JSON.parse(ssrCache.innerHTML) };
      ssrCache.remove();
    } catch (e) {
      console.log('Error reading SSR cache', e);
    }
  }

  /**
   * Iterates through all found style elements generated when server side rendering.
   */
  const ssrStyles = document.querySelectorAll<HTMLStyleElement>('style[data-cmpld="s"]');
  for (let i = 0; i < ssrStyles.length; i++) {
    // Create the client cache for all SSR'd classes
    const stylesheet = ssrStyles[i];
    // move all SSR style tags to the head straight away
    document.head.appendChild(stylesheet);

    // consolidate styles
    setTimeout(() => {
      const { nonce } = stylesheet;
      const rulesText = stylesheet.innerHTML || '';
      if (rulesText) {
        const rulesArr = rulesText.split(/}[.@]?/g);
        for (let j = 0; j < rulesArr.length; j++) {
          let rule = rulesArr[j];
          // if the rule is empty we continue
          if (!rule) continue;
          switch (rule.charCodeAt(0)) {
            // rule starts with . so we just need to close witn }
            case 46:
              rule += '}';
              break;

            // rule starts with _ so needs to prepend . and close with }
            case 95:
              rule = '.' + rule + '}';
              break;

            // this is for @ rules so we prepend @ and close with }
            default:
              rule = '@' + rule + '}';
              break;
          }

          // Add the rule to a new style tag in the head
          insertRule(rule, { nonce });
        }
      }
      // remove SSR'd style tag
      stylesheet.remove();
    }, 20);
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

export const SSRCacheComponent = ({ nonce }: { nonce: string }): JSX.Element | null =>
  isNodeEnvironment() ? (
    <script
      type="text/json"
      data-cmpld="c"
      nonce={nonce}
      // During runtime this hook isn't conditionally called - it is at build time that the flow gets decided.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      dangerouslySetInnerHTML={{ __html: JSON.stringify(useCache()) }}></script>
  ) : null;

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
