import { hash } from '@compiled/utils';

import { PluginOptions } from '../types';

export interface CacheOptions extends PluginOptions {
  cache?: boolean;
  maxSize?: number;
}

const defaultOptions = {
  cache: true,
  maxSize: 500,
};

export class Cache {
  _options: CacheOptions & typeof defaultOptions = defaultOptions;
  _cache: InstanceType<typeof Map>;

  constructor() {
    // TODO: Replace `this._instanceKey` with `this.#instanceKey` once we upgrade to typescript >= 3.8
    this._cache = new Map();
  }

  /**
   * Returns hash of `cacheKey` and `namespace` if `namespace` is present
   * otherwise returns hash of `cacheKey` only.
   *
   * @param cacheKey Key for caching
   * @param namespace Namespace for grouping
   */
  static getUniqueKey(cacheKey: string, namespace?: string) {
    return hash(namespace ? `${namespace}----${cacheKey}` : cacheKey);
  }

  /**
   * Lazy evaluates the passed value and save it into the cache.
   * Also returns the lazy evaluated value.
   *
   * @param uniqueKey Unique cache key
   * @param value Value to be cached
   */
  _saveToCache<T>(uniqueKey: string, value: () => T) {
    const lazyValue = value();

    this._cache.set(uniqueKey, lazyValue);

    return lazyValue;
  }

  /**
   * Deletes least recently used value (first in queue) from cache if cache size
   * reaches its max size.
   */
  _tryDeletingLRUCachedValue() {
    if (this._cache.size >= this._options.maxSize) {
      const key = this._cache.keys().next().value;

      this._cache.delete(key);
    }
  }

  /**
   * Moves frequently accessed value last into queue so that they won't get deleted
   * when cache size reaches its max size.
   *
   * @param uniqueKey Unique cache key
   * @param cacheValue Cached value
   */
  _moveLastInQueue<T>(uniqueKey: string, cacheValue: T) {
    this._cache.delete(uniqueKey);

    this._cache.set(uniqueKey, cacheValue);
  }

  /**
   * Loads cached value from cache and returns it. Also move it last into queue.
   *
   * @param uniqueKey Unique cache key
   */
  _loadFromCache<T>(uniqueKey: string) {
    const cacheValue = this._cache.get(uniqueKey);

    this._moveLastInQueue(uniqueKey, cacheValue);

    return cacheValue as T;
  }

  /**
   * Initialize cache with its options.
   *
   * @param options Cache options
   */
  initialize(options: CacheOptions) {
    this._options = { ...defaultOptions, ...options };
  }

  /**
   * Checks if we can cache the value. If not, it will just evaluate the passed
   * value and returns it. If yes, it will start caching it. If value is already
   * cached, returns it otherwise put it into the cache and delete least recently
   * used value if cache is full.
   *
   * @param cacheKey Key for caching
   * @param namespace Namespace for grouping
   * @param value Value to be cached
   */
  load<T>({
    cacheKey,
    namespace,
    value = () => ({} as T),
  }: {
    cacheKey: string;
    namespace?: string;
    value?: () => T;
  }) {
    if (!this._options.cache) {
      console.log('IGNORING CACHE');

      return value();
    }

    const uniqueKey = Cache.getUniqueKey(cacheKey, namespace);

    if (this._cache.has(uniqueKey)) {
      return this._loadFromCache<T>(uniqueKey);
    }

    this._tryDeletingLRUCachedValue();

    return this._saveToCache<T>(uniqueKey, value);
  }

  /**
   * Returns cache size
   */
  getSize() {
    return this._cache.size;
  }

  /**
   * Returns cache keys
   */
  getKeys() {
    return this._cache.keys();
  }

  /**
   * Returns cache values
   */
  getValues() {
    return this._cache.values();
  }
}
