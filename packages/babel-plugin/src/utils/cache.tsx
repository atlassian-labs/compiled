import { hash } from '@compiled/utils';

import type { PluginOptions } from '../types';

export interface CacheOptions extends PluginOptions {
  cache?: boolean;
  maxSize?: number;
}

const defaultOptions = {
  cache: true,
  maxSize: 500,
};

export class Cache<T = any> {
  _options: CacheOptions & typeof defaultOptions = defaultOptions;
  _cache: Map<string, T>;

  constructor() {
    this._cache = new Map();
  }

  /**
   * Returns hash of `cacheKey` and `namespace` if `namespace` is present
   * otherwise returns hash of `cacheKey` only.
   *
   * @param cacheKey Key for caching
   * @param namespace Namespace for grouping
   */
  static getUniqueKey(cacheKey: string, namespace?: string): string {
    return hash(namespace ? `${namespace}----${cacheKey}` : cacheKey);
  }

  /**
   * Lazy evaluates the passed value and save it into the cache.
   * Also returns the lazy evaluated value.
   *
   * @param uniqueKey Unique cache key
   * @param value Value to be cached
   */
  _saveToCache<TValue extends T>(uniqueKey: string, value: () => TValue): TValue {
    const lazyValue = value();

    this._cache.set(uniqueKey, lazyValue);

    return lazyValue;
  }

  /**
   * Deletes least recently used value (first in queue) from cache if cache size
   * reaches its max size.
   */
  _tryDeletingLRUCachedValue(): void {
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
  _moveLastInQueue(uniqueKey: string, cacheValue: T): void {
    this._cache.delete(uniqueKey);

    this._cache.set(uniqueKey, cacheValue);
  }

  /**
   * Loads cached value from cache and returns it. Also move it last into queue.
   *
   * @param uniqueKey Unique cache key
   */
  _loadFromCache<TValue extends T>(uniqueKey: string): TValue {
    const cacheValue = this._cache.get(uniqueKey) as TValue;

    this._moveLastInQueue(uniqueKey, cacheValue);

    return cacheValue;
  }

  /**
   * Initialize cache with its options.
   *
   * @param options Cache options
   */
  initialize(options: CacheOptions): void {
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
  load<TValue extends T>({
    cacheKey,
    namespace,
    value,
  }: {
    namespace?: string;
    cacheKey: string;
    value: () => TValue;
  }): TValue {
    if (!this._options.cache) {
      return value();
    }

    const uniqueKey = Cache.getUniqueKey(cacheKey, namespace);

    if (this._cache.has(uniqueKey)) {
      return this._loadFromCache(uniqueKey);
    }

    this._tryDeletingLRUCachedValue();

    return this._saveToCache(uniqueKey, value);
  }

  /**
   * Returns cache size
   */
  getSize(): number {
    return this._cache.size;
  }

  /**
   * Returns cache keys
   */
  getKeys(): IterableIterator<string> {
    return this._cache.keys();
  }

  /**
   * Returns cache values
   */
  getValues(): IterableIterator<T> {
    return this._cache.values();
  }
}
