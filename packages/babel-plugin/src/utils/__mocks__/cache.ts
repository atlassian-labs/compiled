const { Cache } = jest.requireActual('../cache');

Cache.getUniqueKey = (key: string, namespace?: string) =>
  namespace ? `${namespace}----${key}` : key;

export { Cache };
