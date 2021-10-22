import { Resolver } from '@parcel/plugin';
import { dirname, join } from 'path';

export default new Resolver({
  async resolve({ dependency: { moduleSpecifier: specifier, resolveFrom } }) {
    const prefix = 'alias!';
    if (specifier.startsWith(prefix)) {
      return {
        filePath: join(dirname(resolveFrom!), specifier.substr(prefix.length)),
      };
    }

    // Let the next resolver in the pipeline handle this dependency
    return null;
  },
});
