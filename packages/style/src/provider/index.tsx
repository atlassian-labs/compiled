import { ProviderComponent, UseCacheHook } from './types';

export const useCache: UseCacheHook =
  typeof window === 'undefined'
    ? require('./provider-server').useCache
    : require('./provider-browser').useCache;

const Provider: ProviderComponent =
  typeof window === 'undefined'
    ? require('./provider-server').default
    : require('./provider-browser').default;

export default Provider;
