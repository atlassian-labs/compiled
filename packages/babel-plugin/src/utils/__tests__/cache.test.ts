import type { CacheOptions } from '../cache';
import { Cache } from '../cache';

jest.mock('../cache');

describe('#Cache', () => {
  const setup = (options: CacheOptions = {}) => {
    const cache = new Cache();

    cache.initialize(options);

    return cache;
  };

  it('should cache the values with default "cache" option as true', () => {
    const cache = setup();
    const lazyValue = jest.fn().mockReturnValue(10);

    const data = { namespace: 'namespace', cacheKey: 'cacheKey', value: lazyValue };
    const value = cache.load(data);

    expect(cache.getSize()).toBe(1);
    expect(lazyValue).toHaveBeenCalledTimes(1);
    expect(value).toBe(10);
  });

  it('should cache the values when "cache" option is true', () => {
    const cache = setup({ cache: true });
    const lazyValue = jest.fn().mockReturnValue(10);

    const data = { namespace: 'namespace', cacheKey: 'cacheKey', value: lazyValue };
    const value = cache.load(data);

    expect(cache.getSize()).toBe(1);
    expect(lazyValue).toHaveBeenCalledTimes(1);
    expect(value).toBe(10);
  });

  it('should not cache the values when "cache" option is false', () => {
    const cache = setup({ cache: false });
    const lazyValue = jest.fn().mockReturnValue(10);

    const data = { namespace: 'namespace', cacheKey: 'cacheKey', value: lazyValue };
    const value = cache.load(data);

    expect(cache.getSize()).toBe(0);
    expect(lazyValue).toHaveBeenCalledTimes(1);
    expect(value).toBe(10);
  });

  it('should return original cached value when accessed with original key', () => {
    const cache = setup();
    const lazyValue = jest.fn().mockReturnValue(10);

    const data = { namespace: 'namespace', cacheKey: 'cacheKey', value: lazyValue };

    cache.load(data);
    cache.load(data);
    const value = cache.load(data);

    expect(lazyValue).toHaveBeenCalledTimes(1);
    expect(value).toBe(10);
  });

  it('should move frequently used keys in last position of queue', () => {
    const cache = setup();

    const data1 = { namespace: 'namespace1', cacheKey: 'cacheKey1', value: () => 10 };
    const data2 = { cacheKey: 'cacheKey2', value: () => 20 };
    const data3 = { namespace: 'namespace3', cacheKey: 'cacheKey3', value: () => 30 };

    cache.load(data1);
    cache.load(data2);
    cache.load(data3);

    expect(Array.from(cache.getKeys())).toEqual([
      'namespace1----cacheKey1',
      'cacheKey2',
      'namespace3----cacheKey3',
    ]);

    cache.load(data2);
    cache.load(data1);

    expect(Array.from(cache.getKeys())).toEqual([
      'namespace3----cacheKey3',
      'cacheKey2',
      'namespace1----cacheKey1',
    ]);
  });

  it('should should delete first key value pair from queue when exceeds max size', () => {
    const cache = setup({ maxSize: 3 });

    const data1 = { namespace: 'namespace1', cacheKey: 'cacheKey1', value: () => 10 };
    const data2 = { namespace: 'namespace2', cacheKey: 'cacheKey2', value: () => 20 };
    const data3 = { cacheKey: 'cacheKey3', value: () => 30 };

    cache.load(data1);
    cache.load(data2);
    cache.load(data3);

    cache.load(data2);

    expect(Array.from(cache.getKeys())).toEqual([
      'namespace1----cacheKey1',
      'cacheKey3',
      'namespace2----cacheKey2',
    ]);

    const data4 = { namespace: 'namespace4', cacheKey: 'cacheKey4', value: () => 40 };
    const value = cache.load(data4);

    expect(Array.from(cache.getKeys())).toEqual([
      'cacheKey3',
      'namespace2----cacheKey2',
      'namespace4----cacheKey4',
    ]);

    expect(value).toBe(40);
  });
});
