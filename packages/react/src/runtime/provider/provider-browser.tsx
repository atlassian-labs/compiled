import { isNodeEnvironment } from '../is-node';
import { ProviderComponent, UseCacheHook } from './types';

if (process.env.NODE_ENV === 'development' && isNodeEnvironment()) {
  throw new Error(
    `
 ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗██╗     ███████╗██████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║██║     ██╔════╝██╔══██╗
██║     ██║   ██║██╔████╔██║██████╔╝██║██║     █████╗  ██║  ██║
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║██║     ██╔══╝  ██║  ██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║███████╗███████╗██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═════╝

  @compiled/react/runtime - ERROR

  This code should only run on the client. You might need to configure your bundler to respect the "browser" field in package json.
`
  );
}

/**
 * Singleton cache for tracking what styles have already been added to the head.
 * Should only run on the client!
 */
const inserted: Record<string, true> = {};

/**
 * Iterates through all found style elements generated when server side rendering.
 *
 * @param cb
 */
const forEachSSRdStyleElement = (cb: (element: HTMLStyleElement) => void) => {
  const ssrStyles = document.querySelectorAll<HTMLStyleElement>('style[data-cmpld]');
  for (let i = 0; i < ssrStyles.length; i++) {
    cb(ssrStyles[i]);
  }
};

// Move all found server-side rendered style elements to the head before React hydration happens.
forEachSSRdStyleElement((styleElement) => {
  document.head.appendChild(styleElement);
});

/**
 * Will return a singleton objet used for knowing if a sheet has been inserted.
 */
export const useCache: UseCacheHook = () => {
  return inserted;
};

/**
 * Noops on the client
 */
const Fragment: ProviderComponent = (props: { children: JSX.Element[] | JSX.Element }) =>
  props.children as JSX.Element;

export default Fragment;
