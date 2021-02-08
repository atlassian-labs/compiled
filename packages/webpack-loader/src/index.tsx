import path from 'path';
import { transform } from '@compiled/babel-plugin';

/**
 * Compiled webpack loader.
 *
 * @param this
 * @param content
 */
export default async function compiledLoader(this: any, content: string): Promise<void> {
  const callback = this.async();
  const result = await transform(content);

  result.includedFiles.forEach((file) => {
    this.addDependency(path.normalize(file));
  });

  callback(null, result.code);
}
