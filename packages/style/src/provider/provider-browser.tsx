import { ProviderComponent, UseCacheHook } from './types';

if (typeof window === 'undefined') {
  throw new Error(
    `
 ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗██╗     ███████╗██████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║██║     ██╔════╝██╔══██╗
██║     ██║   ██║██╔████╔██║██████╔╝██║██║     █████╗  ██║  ██║
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║██║     ██╔══╝  ██║  ██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║███████╗███████╗██████╔╝
  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═════╝

  @compiled/css-in-js - ERROR

  This piece of code should only run on the client.
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
const Provider: ProviderComponent = (props: { children: JSX.Element[] | JSX.Element }) =>
  props.children;

export default Provider;
