import { Resolver } from '@parcel/plugin';

export default new Resolver({
  async resolve({ dependency: { specifier } }) {
    const prefix = 'compiled-css!';
    if (specifier.startsWith(prefix)) {
      return {
        isExcluded: true,
      };
    }

    // Let the next resolver in the pipeline handle this dependency
    return null;
  },
});
