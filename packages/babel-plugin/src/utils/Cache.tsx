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

  static getUniqueKey(cacheKey: string, namespace?: string) {
    return hash(namespace ? `${namespace}----${cacheKey}` : cacheKey);
  }

  _saveToCache<T>(uniqueKey: string, value: () => T) {
    const lazyValue = value();

    this._cache.set(uniqueKey, lazyValue);

    return lazyValue;
  }

  _tryDeletingLRUCachedValue() {
    if (this._cache.size >= this._options.maxSize) {
      const key = this._cache.keys().next().value;

      this._cache.delete(key);
    }
  }

  _moveLastInQueue<T>(uniqueKey: string, cacheValue: T) {
    this._cache.delete(uniqueKey);

    this._cache.set(uniqueKey, cacheValue);
  }

  _loadFromCache<T>(uniqueKey: string) {
    const cacheValue = this._cache.get(uniqueKey);

    this._moveLastInQueue(uniqueKey, cacheValue);

    return cacheValue as T;
  }

  initialize(options: CacheOptions) {
    this._options = { ...defaultOptions, ...options };
  }

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
      return value();
    }

    const uniqueKey = Cache.getUniqueKey(cacheKey, namespace);

    if (this._cache.has(uniqueKey)) {
      return this._loadFromCache<T>(uniqueKey);
    }

    this._tryDeletingLRUCachedValue();

    return this._saveToCache<T>(uniqueKey, value);
  }

  getSize() {
    return this._cache.size;
  }

  getKeys() {
    return this._cache.keys();
  }

  getValues() {
    return this._cache.values();
  }
}
