import type { Compilation } from 'webpack';
import { util } from 'webpack';

/**
 * Returns the hash of the passed in `content`.
 * Uses the hashing configuration from the current webpack compliation.
 *
 * @param content
 * @param outputOptions
 */
export function hash(content: string, outputOptions: Compilation['outputOptions']): string {
  const { hashFunction, hashDigest, hashDigestLength } = outputOptions;
  const hasher = util.createHash(hashFunction!);
  hasher.update(content);

  const result = hasher.digest(hashDigest);
  if (typeof result === 'string') {
    return result.substring(0, hashDigestLength);
  }

  throw new Error('Hash digest was not supplied.');
}
