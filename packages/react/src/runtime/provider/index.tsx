import { ProviderComponent, UseCacheHook } from './types';
import { isNodeEnvironment } from '../is-node';

export const useCache: UseCacheHook = isNodeEnvironment()
  ? require('./provider-server').useCache
  : require('./provider-browser').useCache;

const Provider: ProviderComponent = isNodeEnvironment()
  ? require('./provider-server').default
  : require('./provider-browser').default;

export default Provider;
