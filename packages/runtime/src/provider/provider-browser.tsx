import { ProviderComponent, UseCacheHook } from './types';

if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  throw new Error(
    `
 ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗██╗     ███████╗██████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║██║     ██╔════╝██╔══██╗
██║     ██║   ██║██╔████╔██║██████╔╝██║██║     █████╗  ██║  ██║
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║██║     ██╔══╝  ██║  ██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║███████╗███████╗██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═════╝

  @compiled/runtime - ERROR

  This code should only run on the client. You might need to configure your bunder to respect the "browser" field in package json.
`
  );
}

/**
 * Singleton cache for tracking what styles have already been added to the head.
 * Should only run on the client!
 */
const inserted: Record<string, true> = {};

/**
 * Noops on the client
 */
export const useCache: UseCacheHook = () => inserted;

/**
 * Noops on the client
 */
const Fragment: ProviderComponent = (props: { children: JSX.Element[] | JSX.Element }) =>
  props.children as JSX.Element;

export default Fragment;
