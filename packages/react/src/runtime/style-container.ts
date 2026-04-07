import React, { type ReactElement } from 'react';

import { isServerEnvironment } from './is-server-environment.js';

export interface StyleContainerConfig {
  /**
   * The DOM node into which Compiled will insert `<style>` elements.
   */
  container: HTMLElement | ShadowRoot;
  /**
   * A unique key used to namespace the deduplication cache for this container.
   * Styles inserted into this container are tracked separately from the main
   * document cache, preventing cross-container cache collisions.
   *
   * Choose a key that is unique per container instance (e.g. `"shadow-toolbar"`).
   */
  cacheKey: string;
}

/**
 * Singleton holding the currently active style container config on the client.
 * Read directly by useStyleContainer().
 */
export let clientStyleContainer: StyleContainerConfig | null = null;

/**
 * Returns the currently active style container config.
 */
export const useStyleContainer = (): StyleContainerConfig | null => {
  return clientStyleContainer;
};

/**
 * Provides a custom DOM container for Compiled style injection within a React subtree.
 *
 * **Runtime mode only.** This provider is not supported in server environments or when
 * using CSS extraction (`@compiled/babel-plugin-strip-runtime`). In extraction mode,
 * `CS`/`CC` components are removed at build time, so there is nothing for this provider
 * to intercept. Supporting Shadow DOM with extraction is a known limitation and is
 * planned as future work.
 *
 * Use this when rendering Compiled components inside a Shadow DOM, where styles
 * inserted into the main document `<head>` are not visible to the shadow tree.
 *
 * The `cacheKey` must be unique per container and is used to namespace the
 * deduplication cache so styles are tracked independently per container.
 *
 * @example
 * ```tsx
 * import { StyleContainerProvider } from '@compiled/react';
 * import { createPortal } from 'react-dom';
 *
 * function ShadowHost() {
 *   const hostRef = useRef<HTMLDivElement>(null);
 *   const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
 *
 *   useEffect(() => {
 *     if (hostRef.current && !hostRef.current.shadowRoot) {
 *       setShadowRoot(hostRef.current.attachShadow({ mode: 'open' }));
 *     }
 *   }, []);
 *
 *   return (
 *     <div ref={hostRef}>
 *       {shadowRoot &&
 *         createPortal(
 *           <StyleContainerProvider container={shadowRoot} cacheKey="my-shadow-root">
 *             <MyCompiledComponent />
 *           </StyleContainerProvider>,
 *           shadowRoot
 *         )}
 *     </div>
 *   );
 * }
 * ```
 */
export function StyleContainerProvider({
  container,
  cacheKey,
  children,
}: StyleContainerConfig & { children: React.ReactNode }): ReactElement {
  if (isServerEnvironment()) {
    throw new Error(
      '@compiled/react: StyleContainerProvider is not supported in server environments. ' +
        'It is only intended for client-side Shadow DOM use cases in runtime mode.'
    );
  }

  // On the client, set the singleton synchronously during the render phase via
  // useMemo so CS children pick it up immediately.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useMemo(() => {
    clientStyleContainer = { container, cacheKey };
  }, [container, cacheKey]);

  // Clear the singleton when this provider unmounts.
  // Note: nested StyleContainerProviders are not supported. If an inner provider
  // unmounts, this will clear clientStyleContainer to null rather than restoring
  // the outer provider's value. This is an acceptable limitation for the intended
  // use case of a single provider wrapping a shadow DOM subtree.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    return () => {
      clientStyleContainer = null;
    };
  }, []);

  return children as ReactElement;
}
