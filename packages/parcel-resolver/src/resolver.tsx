import { dirname, join } from 'path';

import { Resolver } from '@parcel/plugin';

const resolver = new Resolver({
  async resolve({ dependency }) {
    const { specifier, resolveFrom } = dependency;

    const cssPrefix = 'compiled-css!';
    if (specifier.startsWith(cssPrefix)) {
      const code = decodeURIComponent(specifier.slice(cssPrefix.length));
      return {
        filePath: join(dirname(resolveFrom!), specifier.slice(cssPrefix.length) + '.css'),
        code,
      };
    }

    // Let the next resolver in the pipeline handle this dependency
    return null;
  },
});

export default resolver;
