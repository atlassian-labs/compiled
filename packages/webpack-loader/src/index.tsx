import path from 'path';
import { transform } from '@compiled/babel-plugin';

/**
 * Compiled webpack loader.
 *
 * @param this
 * @param code
 */
export default async function compiledLoader(this: any, code: string): Promise<void> {
  const callback = this.async();

  // Bail early if Compiled isn't in the module.
  if (code.indexOf('@compiled/react') === -1) {
    return callback(null, code);
  }

  try {
    const result = await transform(code, {
      filename: this.resourcePath,
      opts: { cache: true },
    });

    result.includedFiles.forEach((file) => {
      this.addDependency(path.normalize(file));
    });

    callback(null, result.code);
  } catch (e) {
    callback(e);
  }
}
